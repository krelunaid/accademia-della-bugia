import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { iso } from "@/lib/format";
import type { Profile } from "@/lib/types";

const EDITOR_CODE = "LEPIASTRE1966";

type ProfileRow = {
  user_id: string;
  display_name: string;
  is_editor: boolean;
  wants_updates: boolean;
  last_seen_at: unknown;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    isEditor: row.is_editor,
    wantsUpdates: Boolean(row.wants_updates),
    lastSeenAt: row.last_seen_at ? iso(row.last_seen_at) : null,
  };
}

export async function ensureProfile(userId: string, displayName: string) {
  const sql = await getSql();
  const name = displayName.trim() || "Bugiardo anonimo";
  await sql`
    insert into profiles (user_id, display_name)
    values (${userId}, ${name})
    on conflict (user_id) do nothing
  `;
}

export async function requireEditor(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ is_editor: boolean }>`
    select is_editor from profiles where user_id = ${userId}
  `;
  if (!rows[0]?.is_editor) {
    throw new Error("Solo i redattori dell'Accademia possono farlo.");
  }
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, "Ospite");
    const rows = await sql<ProfileRow>`
      select user_id, display_name, is_editor, wants_updates, last_seen_at
      from profiles where user_id = ${context.userId}
    `;
    return rows[0] ? mapProfile(rows[0]) : null;
  });

export const updateMyName = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) => z.object({ displayName: z.string().trim().min(2).max(80) }).parse(value))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, data.displayName);
    await sql`
      update profiles set display_name = ${data.displayName}
      where user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const claimEditor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) =>
    z.object({ code: z.string().trim().optional(), displayName: z.string().trim().max(80).optional() }).parse(value),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const name = data.displayName?.trim() || "Redattore";
    await ensureProfile(context.userId, name);
    if (data.displayName?.trim()) {
      await sql`
        update profiles set display_name = ${data.displayName.trim()}
        where user_id = ${context.userId}
      `;
    }

    const existing = await sql<{ n: number }>`
      select count(*)::int as n from profiles where is_editor = true
    `;
    const empty = (existing[0]?.n ?? 0) === 0;
    const codeOk = (data.code ?? "").replace(/\s/g, "").toUpperCase() === EDITOR_CODE;

    if (!empty && !codeOk) {
      throw new Error(
        "La Redazione è già occupata. Chiedi il codice al consiglio dell'Accademia (paese + anno di fondazione).",
      );
    }

    await sql`
      update profiles set is_editor = true where user_id = ${context.userId}
    `;
    return { ok: true, first: empty };
  });
