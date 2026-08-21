import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { iso } from "@/lib/format";
import type { Challenge, Submission } from "@/lib/types";
import { ensureProfile, requireEditor } from "./profiles";

type ChallengeRow = {
  id: number;
  author_id: string;
  title: string;
  prompt: string;
  category: string;
  status: string;
  deadline: unknown;
  created_at: unknown;
  submission_count: number;
};

type SubmissionRow = {
  id: number;
  challenge_id: number;
  user_id: string;
  author_name: string;
  title: string;
  body: string;
  is_winner: boolean;
  created_at: unknown;
};

function mapChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    prompt: row.prompt,
    category: row.category,
    status: row.status,
    deadline: row.deadline ? iso(row.deadline) : null,
    createdAt: iso(row.created_at),
    submissionCount: Number(row.submission_count ?? 0),
  };
}

function mapSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    userId: row.user_id,
    authorName: row.author_name,
    title: row.title,
    body: row.body,
    isWinner: Boolean(row.is_winner),
    createdAt: iso(row.created_at),
  };
}

const challengeSelect = `
  select c.id, c.author_id, c.title, c.prompt, c.category, c.status, c.deadline, c.created_at,
         (select count(*)::int from submissions s where s.challenge_id = c.id) as submission_count
  from challenges c
`;

export const listChallenges = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<ChallengeRow>(
    `${challengeSelect}
     order by case when c.status = 'aperta' then 0 when c.status = 'chiusa' then 1 else 2 end,
              c.created_at desc`,
  );
  return rows.map(mapChallenge);
});

export const getChallenge = createServerFn({ method: "GET" })
  .validator((value: unknown) => z.object({ id: z.number().int() }).parse(value))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<ChallengeRow>(`${challengeSelect} where c.id = $1`, [data.id]);
    if (!rows[0]) throw new Error("Questa sfida non esiste, o è una bugia ben riuscita.");
    const subs = await sql<SubmissionRow>`
      select id, challenge_id, user_id, author_name, title, body, is_winner, created_at
      from submissions
      where challenge_id = ${data.id}
      order by is_winner desc, created_at desc
    `;
    return {
      challenge: mapChallenge(rows[0]),
      submissions: subs.map(mapSubmission),
    };
  });

export const createChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) =>
    z
      .object({
        title: z.string().trim().min(3).max(160),
        prompt: z.string().trim().min(12).max(8000),
        category: z.enum(["verbale", "letteraria", "grafica", "libera"]),
        deadline: z.string().trim().max(40).optional(),
      })
      .parse(value),
  )
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId, "Redattore");
    await requireEditor(context.userId);
    const deadline = data.deadline ? data.deadline : null;
    const sql = await getSql();
    const inserted = await sql<ChallengeRow>`
      insert into challenges (author_id, title, prompt, category, status, deadline)
      values (
        ${context.userId},
        ${data.title},
        ${data.prompt},
        ${data.category},
        'aperta',
        ${deadline}
      )
      returning id, author_id, title, prompt, category, status, deadline, created_at, 0::int as submission_count
    `;
    return mapChallenge(inserted[0]);
  });

export const updateChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) =>
    z
      .object({
        id: z.number().int(),
        title: z.string().trim().min(3).max(160),
        prompt: z.string().trim().min(12).max(8000),
        category: z.enum(["verbale", "letteraria", "grafica", "libera"]),
        status: z.enum(["aperta", "chiusa", "giudicata"]),
        deadline: z.string().trim().max(40).nullable().optional(),
      })
      .parse(value),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const sql = await getSql();
    await sql`
      update challenges
      set title = ${data.title},
          prompt = ${data.prompt},
          category = ${data.category},
          status = ${data.status},
          deadline = ${data.deadline ?? null}
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const setChallengeStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) =>
    z
      .object({
        id: z.number().int(),
        status: z.enum(["aperta", "chiusa", "giudicata"]),
      })
      .parse(value),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const sql = await getSql();
    await sql`update challenges set status = ${data.status} where id = ${data.id}`;
    return { ok: true };
  });

export const deleteChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) => z.object({ id: z.number().int() }).parse(value))
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const sql = await getSql();
    await sql`delete from challenges where id = ${data.id}`;
    return { ok: true };
  });

export const submitEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) =>
    z
      .object({
        challengeId: z.number().int(),
        title: z.string().trim().min(3).max(160),
        body: z.string().trim().min(20).max(8000),
        authorName: z.string().trim().min(2).max(80).optional(),
      })
      .parse(value),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const name = data.authorName?.trim() || "Bugiardo anonimo";
    await ensureProfile(context.userId, name);
    if (data.authorName?.trim()) {
      await sql`
        update profiles set display_name = ${data.authorName.trim()}
        where user_id = ${context.userId}
      `;
    }

    const profile = await sql<{ display_name: string }>`
      select display_name from profiles where user_id = ${context.userId}
    `;
    const authorName = profile[0]?.display_name || name;

    const challenge = await sql<{ status: string; deadline: Date | string | null }>`
      select status, deadline from challenges where id = ${data.challengeId}
    `;
    if (!challenge[0]) throw new Error("Sfida introvabile.");
    if (challenge[0].status !== "aperta") {
      throw new Error("Questa sfida non accoglie più bugie.");
    }
    if (challenge[0].deadline && new Date(challenge[0].deadline).getTime() < Date.now()) {
      throw new Error("Il tempo è scaduto. La bugia, per una volta, deve essere puntuale.");
    }

    const rows = await sql<SubmissionRow>`
      insert into submissions (challenge_id, user_id, author_name, title, body)
      values (${data.challengeId}, ${context.userId}, ${authorName}, ${data.title}, ${data.body})
      on conflict (challenge_id, user_id) do update
        set title = excluded.title,
            body = excluded.body,
            author_name = excluded.author_name
      returning id, challenge_id, user_id, author_name, title, body, is_winner, created_at
    `;
    return mapSubmission(rows[0]);
  });

export const pickWinner = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) =>
    z.object({ challengeId: z.number().int(), submissionId: z.number().int() }).parse(value),
  )
  .handler(async ({ context, data }) => {
    await requireEditor(context.userId);
    const sql = await getSql();
    await sql`
      update submissions set is_winner = false where challenge_id = ${data.challengeId}
    `;
    await sql`
      update submissions
      set is_winner = true
      where id = ${data.submissionId} and challenge_id = ${data.challengeId}
    `;
    await sql`
      update challenges set status = 'giudicata' where id = ${data.challengeId}
    `;
    return { ok: true };
  });
