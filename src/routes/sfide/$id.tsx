import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { getChallenge, pickWinner, submitEntry } from "@/lib/server/challenges";
import { getMyProfile } from "@/lib/server/profiles";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CATEGORY_LABEL, STATUS_LABEL, deadlineLabel, formatDate } from "@/lib/format";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Paper } from "@/components/cards";
import type { Profile, Submission } from "@/lib/types";

export const Route = createFileRoute("/sfide/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw new Error("Sfida non trovata.");
    return getChallenge({ data: { id } });
  },
  component: ChallengePage,
});

function ChallengePage() {
  const { challenge, submissions } = Route.useLoaderData();
  const router = useRouter();
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<Profile | null>(null);
  const mine = user ? submissions.find((s) => s.userId === user.id) : undefined;
  const open = challenge.status === "aperta";
  const due = deadlineLabel(challenge.deadline);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void getMyProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          <Link to="/sfide" className="hover:text-cream">
            Sfide
          </Link>
          {" · "}
          {CATEGORY_LABEL[challenge.category] ?? challenge.category}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={open ? "accent" : "muted"}>{STATUS_LABEL[challenge.status]}</Badge>
          {due ? <Badge tone="live">{due}</Badge> : null}
        </div>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          {challenge.title}
        </h1>
        <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-cream/80">
          {challenge.prompt}
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">
          {submissions.length} {submissions.length === 1 ? "deposito" : "depositi"}
          {challenge.deadline ? ` · termine ${formatDate(challenge.deadline)}` : ""}
        </p>

        {open ? (
          <section className="mt-12">
            {isPending ? (
              <div className="h-40 animate-pulse rounded-xl bg-surface" />
            ) : user ? (
              <SubmitForm
                challengeId={challenge.id}
                existing={mine}
                defaultName={profile?.displayName ?? user.displayName ?? ""}
                onSaved={async () => {
                  await router.invalidate();
                }}
              />
            ) : (
              <Paper>
                <p className="font-display text-xl tracking-tight">Per depositare, entra</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  Google, X, o email e password. Così la bugia resta firmata, e al
                  prossimo accesso trovi anche gli aggiornamenti della Redazione.
                </p>
                <Link to="/login" search={{ redirect: `/sfide/${challenge.id}` }}>
                  <Button className="mt-5">Entra in Accademia</Button>
                </Link>
              </Paper>
            )}
          </section>
        ) : null}

        <section className="mt-14">
          <h2 className="font-display text-2xl tracking-tight">Le bugie depositate</h2>
          <div className="mt-6 space-y-4">
            {submissions.length ? (
              submissions.map((s) => (
                <SubmissionCard
                  key={s.id}
                  item={s}
                  mine={user?.id === s.userId}
                  canJudge={Boolean(profile?.isEditor)}
                  challengeId={challenge.id}
                  onPicked={async () => {
                    await router.invalidate();
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-cream/70">Ancora silenzio. Qualcuno deve cominciare a mentire.</p>
            )}
          </div>
        </section>
      </article>
    </SiteShell>
  );
}

function SubmitForm({
  challengeId,
  existing,
  defaultName,
  onSaved,
}: {
  challengeId: number;
  existing?: Submission;
  defaultName: string;
  onSaved: () => Promise<void>;
}) {
  const [authorName, setAuthorName] = useState(existing?.authorName || defaultName);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await submitEntry({
        data: { challengeId, title, body, authorName: authorName.trim() || undefined },
      });
      toast.success(existing ? "Bugia aggiornata." : "Bugia depositata.");
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non è andata a buon fine.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Paper>
      <h2 className="font-display text-2xl tracking-tight">
        {existing ? "La tua bugia (puoi ancora correggerla)" : "Deposita la tua bugia"}
      </h2>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="author" className="text-ink">
            Firma
          </Label>
          <Input
            id="author"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="border-line bg-paper-2 text-ink placeholder:text-muted"
            required
            minLength={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-ink">
            Titolo
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-line bg-paper-2 text-ink"
            required
            minLength={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body" className="text-ink">
            Il fatto (che non è accaduto)
          </Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-40 border-line bg-paper-2 text-ink"
            required
            minLength={20}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Deposito…" : existing ? "Aggiorna" : "Deposita"}
        </Button>
      </form>
    </Paper>
  );
}

function SubmissionCard({
  item,
  mine,
  canJudge,
  challengeId,
  onPicked,
}: {
  item: Submission;
  mine: boolean;
  canJudge: boolean;
  challengeId: number;
  onPicked: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  return (
    <Paper className={item.isWinner ? "ring-2 ring-accent" : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        {item.isWinner ? <Badge tone="accent">Vincitrice</Badge> : null}
        {mine ? <Badge tone="paper">La tua</Badge> : null}
        <span className="text-xs uppercase tracking-[0.14em] text-muted">{item.authorName}</span>
      </div>
      <h3 className="mt-2 font-display text-xl tracking-tight">{item.title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{item.body}</p>
      {canJudge && !item.isWinner ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 border-line text-ink hover:bg-ink hover:text-cream"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              await pickWinner({ data: { challengeId, submissionId: item.id } });
              toast.success("Bugiardino d'oro assegnato.");
              await onPicked();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Non assegnata.");
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Assegno…" : "Proclama vincitrice"}
        </Button>
      ) : null}
    </Paper>
  );
}
