import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type { AlmanacEntry } from "@/lib/types";

type Row = {
  id: number;
  year: number;
  section: string;
  winner_name: string;
  title: string;
  body: string;
};

export const listAlmanac = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<Row>`
    select id, year, section, winner_name, title, body
    from almanac_entries
    order by year desc, sort_order
  `;
  return rows.map((row) => ({
    id: row.id,
    year: row.year,
    section: row.section,
    winnerName: row.winner_name,
    title: row.title,
    body: row.body,
  })) satisfies AlmanacEntry[];
});
