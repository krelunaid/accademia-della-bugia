import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { iso } from "@/lib/format";
import type { Announcement, Challenge, MySubmission, Profile } from "@/lib/types";
import { ensureProfile } from "./profiles";

type ProfileRow = {
  user_id: string;
  display_name: string;
  is_editor: boolean;
  wants_updates: boolean;
  last_seen_at: unknown;
};

type AnnouncementRow = {
  id: number;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: unknown;
};

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

type SubRow = {
  id: number;
  challenge_id: number;
  user_id: string;
  author_name: string;
  title: string;
  body: string;
  is_winner: boolean;
  created_at: unknown;
  challenge_title: string;
  challenge_status: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    isEditor: row.is_editor,
    wantsUpdates: row.wants_updates,
    lastSeenAt: row.last_seen_at ? iso(row.last_seen_at) : null,
  };
}

function isFresh(createdAt: unknown, lastSeen: unknown): boolean {
  if (!lastSeen) return true;
  const created = createdAt instanceof Date ? createdAt.getTime() : Date.parse(String(createdAt));
  const seen = lastSeen instanceof Date ? lastSeen.getTime() : Date.parse(String(lastSeen));
  if (!Number.isFinite(created) || !Number.isFinite(seen)) return false;
  return created > seen;
}

export const getUnreadCount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, "Iscritto");
    const rows = await sql<{ n: number }>`
      select (
        (select count(*)::int from announcements a
          where a.created_at > coalesce(p.last_seen_at, timestamptz '1970-01-01')
        +
        (select count(*)::int from challenges c
          where c.status = 'aperta'
            and c.created_at > coalesce(p.last_seen_at, timestamptz '1970-01-01'))
      ) as n
      from profiles p
      where p.user_id = ${context.userId} and p.wants_updates = true
    `;
    return rows[0]?.n ?? 0;
  });

export const getMyDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, "Iscritto");

    const profiles = await sql<ProfileRow>`
      select user_id, display_name, is_editor, wants_updates, last_seen_at
      from profiles
      where user_id = ${context.userId}
    `;
    const profile = profiles[0] ? mapProfile(profiles[0]) : null;
    const lastSeen = profiles[0]?.last_seen_at ?? null;

    const announcements = await sql<AnnouncementRow>`
      select id, author_id, title, body, pinned, created_at
      from announcements
      order by pinned desc, created_at desc
    `;
    const challenges = await sql.query<ChallengeRow>(
      `select c.id, c.author_id, c.title, c.prompt, c.category, c.status, c.deadline, c.created_at,
              (select count(*)::int from submissions s where s.challenge_id = c.id) as submission_count
       from challenges c
       where c.status = 'aperta'
       order by c.created_at desc`,
    );
    const submissions = await sql<SubRow>`
      select s.id, s.challenge_id, s.user_id, s.author_name, s.title, s.body, s.is_winner, s.created_at,
             c.title as challenge_title, c.status as challenge_status
      from submissions s
      join challenges c on c.id = s.challenge_id
      where s.user_id = ${context.userId}
      order by s.created_at desc
    `;

    const mappedAnnouncements: (Announcement & { isNew: boolean })[] = announcements.map((row) => ({
      id: row.id,
      authorId: row.author_id,
      title: row.title,
      body: row.body,
      pinned: row.pinned,
      createdAt: iso(row.created_at),
      isNew: isFresh(row.created_at, lastSeen),
    }));

    const mappedChallenges: (Challenge & { isNew: boolean })[] = challenges.map((row) => ({
      id: row.id,
      authorId: row.author_id,
      title: row.title,
      prompt: row.prompt,
      category: row.category,
      status: row.status,
      deadline: row.deadline ? iso(row.deadline) : null,
      createdAt: iso(row.created_at),
      submissionCount: Number(row.submission_count ?? 0),
      isNew: isFresh(row.created_at, lastSeen),
    }));

    const mappedSubs: MySubmission[] = submissions.map((row) => ({
      id: row.id,
      challengeId: row.challenge_id,
      userId: row.user_id,
      authorName: row.author_name,
      title: row.title,
      body: row.body,
      isWinner: Boolean(row.is_winner),
      createdAt: iso(row.created_at),
      challengeTitle: row.challenge_title,
      challengeStatus: row.challenge_status,
    }));

    const unreadCount = profile?.wantsUpdates
      ? mappedAnnouncements.filter((a) => a.isNew).length + mappedChallenges.filter((c) => c.isNew).length
      : 0;

    return {
      profile,
      announcements: mappedAnnouncements,
      challenges: mappedChallenges,
      submissions: mappedSubs,
      unreadCount,
    };
  });

export const markDeskSeen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, "Iscritto");
    await sql`
      update profiles set last_seen_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const setWantsUpdates = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((value: unknown) => z.object({ wantsUpdates: z.boolean() }).parse(value))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, "Iscritto");
    await sql`
      update profiles set wants_updates = ${data.wantsUpdates}
      where user_id = ${context.userId}
    `;
    return { ok: true, wantsUpdates: data.wantsUpdates };
  });
