import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { LotteryPrize } from "@/lib/types";
import { requireEditor } from "./profiles";

type Row = {
  id: number;
  ticket_code: string;
  prize: string;
  sponsor: string | null;
  claimed: boolean;
};

function map(row: Row): LotteryPrize {
  return {
    id: row.id,
    ticketCode: row.ticket_code,
    prize: row.prize,
    sponsor: row.sponsor,
    claimed: Boolean(row.claimed),
  };
}

export const listLotteryPrizes = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<Row>`
    select id, ticket_code, prize, sponsor, claimed
    from lottery_prizes
    order by id
  `;
  return rows.map(map);
});

export const lookupTicket = createServerFn({ method: "GET" })
  .validator((value: unknown) =>
    z.object({ code: z.string().trim().min(1).max(12) }).parse(value),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const code = data.code.replace(/\s/g, "");
    const rows = await sql<Row>`
      select id, ticket_code, prize, sponsor, claimed
      from lottery_prizes
      where ticket_code = ${code}
    `;
    return rows[0] ? map(rows[0]) : null;
  });

export const setPrizeClaimed = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) =>
    z.object({ id: z.number().int(), claimed: z.boolean() }).parse(value),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const sql = await getSql();
    await sql`update lottery_prizes set claimed = ${data.claimed} where id = ${data.id}`;
    return { ok: true };
  });
