import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { iso } from "@/lib/format";
import type { Announcement } from "@/lib/types";
import { ensureProfile, requireEditor } from "./profiles";

type Row = {
  id: number;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: unknown;
};

function map(row: Row): Announcement {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    body: row.body,
    pinned: row.pinned,
    createdAt: iso(row.created_at),
  };
}

export const listAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<Row>`
    select id, author_id, title, body, pinned, created_at
    from announcements
    order by pinned desc, created_at desc
  `;
  return rows.map(map);
});

export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) =>
    z
      .object({
        title: z.string().trim().min(3).max(160),
        body: z.string().trim().min(8).max(8000),
        pinned: z.boolean().optional(),
      })
      .parse(value),
  )
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId, "Redattore");
    await requireEditor(context.userId);
    const sql = await getSql();
    const rows = await sql<Row>`
      insert into announcements (author_id, title, body, pinned)
      values (${context.userId}, ${data.title}, ${data.body}, ${data.pinned ?? false})
      returning id, author_id, title, body, pinned, created_at
    `;
    return map(rows[0]);
  });

export const updateAnnouncement = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) =>
    z
      .object({
        id: z.number().int(),
        title: z.string().trim().min(3).max(160),
        body: z.string().trim().min(8).max(8000),
        pinned: z.boolean(),
      })
      .parse(value),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const sql = await getSql();
    await sql`
      update announcements
      set title = ${data.title}, body = ${data.body}, pinned = ${data.pinned}
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) => z.object({ id: z.number().int() }).parse(value))
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const sql = await getSql();
    await sql`delete from announcements where id = ${data.id}`;
    return { ok: true };
  });
