import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABEL, STATUS_LABEL, deadlineLabel, formatDate, relativeTime } from "@/lib/format";
import type { Announcement, Challenge } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Paper({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl bg-paper p-5 text-ink shadow-paper sm:p-6", className)}>
      {children}
    </div>
  );
}

export function AnnouncementCard({
  item,
  featured,
}: {
  item: Announcement;
  featured?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-xl bg-paper p-5 text-ink shadow-paper sm:p-6",
        featured && "sm:p-8",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {item.pinned ? <Badge tone="accent">In evidenza</Badge> : null}
        <time className="text-xs uppercase tracking-[0.14em] text-muted" dateTime={item.createdAt}>
          {formatDate(item.createdAt)}
        </time>
      </div>
      <h3 className={cn("mt-3 font-display tracking-tight", featured ? "text-2xl sm:text-3xl" : "text-xl")}>
        {item.title}
      </h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{item.body}</p>
    </article>
  );
}

export function ChallengeCard({ item }: { item: Challenge }) {
  const due = deadlineLabel(item.deadline);
  const open = item.status === "aperta";
  return (
    <Link
      to="/sfide/$id"
      params={{ id: String(item.id) }}
      className="group block rounded-xl bg-paper p-5 text-ink shadow-paper transition-transform duration-150 hover:-translate-y-0.5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={open ? "accent" : "muted"}>{STATUS_LABEL[item.status] ?? item.status}</Badge>
        <Badge tone="ink">{CATEGORY_LABEL[item.category] ?? item.category}</Badge>
      </div>
      <h3 className="mt-3 font-display text-xl tracking-tight group-hover:text-accent">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/75">{item.prompt}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">
        {item.submissionCount} {item.submissionCount === 1 ? "bugia" : "bugie"}
        {due ? ` · ${due}` : ""}
        {item.createdAt ? ` · ${relativeTime(item.createdAt)}` : ""}
      </p>
    </Link>
  );
}
