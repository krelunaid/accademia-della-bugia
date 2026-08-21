import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyDesk, markDeskSeen, setWantsUpdates } from "@/lib/server/updates";
import { updateMyName } from "@/lib/server/profiles";
import { STATUS_LABEL, formatDate, relativeTime } from "@/lib/format";
import type { Announcement, Challenge, MySubmission, Profile } from "@/lib/types";
import { SiteShell, PageHeader } from "@/components/site-shell";
import { AnnouncementCard, ChallengeCard, Paper } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Desk = {
  profile: Profile | null;
  announcements: (Announcement & { isNew: boolean })[];
  challenges: (Challenge & { isNew: boolean })[];
  submissions: MySubmission[];
  unreadCount: number;
};

export const Route = createFileRoute("/posto")({
  component: Posto,
});

function Posto() {
  const { user, isPending } = useCurrentUserState();
  const [desk, setDesk] = useState<Desk | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void getMyDesk()
      .then((data) => {
        if (cancelled) return;
        setDesk(data);
        setReady(true);
        void markDeskSeen().catch(() => undefined);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPending]);

  if (isPending || !ready) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-3xl px-4 py-20">
          <div className="h-48 animate-pulse rounded-xl bg-surface" />
        </div>
      </SiteShell>
    );
  }
  if (!user) return <Navigate to="/login" search={{ redirect: "/posto" }} />;

  const name = desk?.profile?.displayName ?? user.displayName ?? "Iscritto";
  const freshAnn = desk?.announcements.filter((a) => a.isNew) ?? [];
  const restAnn = desk?.announcements.filter((a) => !a.isNew).slice(0, 3) ?? [];
  const freshCh = desk?.challenges.filter((c) => c.isNew) ?? [];
  const restCh = desk?.challenges.filter((c) => !c.isNew) ?? [];

  return (
    <SiteShell>
      <PageHeader
        kicker="Il tuo posto"
        title={`Ciao, ${name}`}
        lede="Qui trovi quello che la Redazione ha affisso da quando sei uscito. Entra quando vuoi: le novità ti aspettano, non scappano su Facebook."
      />
      <div className="mx-auto max-w-3xl space-y-12 px-4 pb-20 sm:px-6">
        <SubscriptionCard
          profile={desk?.profile ?? null}
          onProfile={(p) => setDesk((d) => (d ? { ...d, profile: p } : d))}
        />

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Bacheca</p>
              <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
                {freshAnn.length ? "Da leggere" : "Annunci recenti"}
              </h2>
            </div>
            <Link to="/annunci" className="text-sm text-cream/70 hover:text-cream">
              Tutta la bacheca
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {(freshAnn.length ? freshAnn : restAnn).length ? (
              (freshAnn.length ? freshAnn : restAnn).map((item) => (
                <div key={item.id}>
                  {item.isNew ? (
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-accent">Nuovo</p>
                  ) : null}
                  <AnnouncementCard item={item} featured={item.pinned} />
                </div>
              ))
            ) : (
              <p className="text-sm text-cream/70">La bacheca è quieta. Torna dopo il prossimo caffè in piazza.</p>
            )}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Prove aperte</p>
              <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
                {freshCh.length ? "Sfide nuove" : "Dove mente"}
              </h2>
            </div>
            <Link to="/sfide" className="text-sm text-cream/70 hover:text-cream">
              Tutte le sfide
            </Link>
          </div>
          <div className="mt-6 grid gap-4">
            {(freshCh.length ? freshCh : restCh).length ? (
              (freshCh.length ? freshCh : restCh).map((item) => (
                <div key={item.id}>
                  {item.isNew ? (
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-accent">Nuova</p>
                  ) : null}
                  <ChallengeCard item={item} />
                </div>
              ))
            ) : (
              <p className="text-sm text-cream/70">Nessuna sfida aperta. La Redazione sta pensando.</p>
            )}
          </div>
        </section>

        <MyLies submissions={desk?.submissions ?? []} />
      </div>
    </SiteShell>
  );
}

function SubscriptionCard({
  profile,
  onProfile,
}: {
  profile: Profile | null;
  onProfile: (p: Profile) => void;
}) {
  const [name, setName] = useState(profile?.displayName ?? "");
  const [pending, setPending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const wants = profile?.wantsUpdates ?? true;

  useEffect(() => {
    setName(profile?.displayName ?? "");
  }, [profile?.displayName]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await updateMyName({ data: { displayName: name.trim() } });
      if (profile) onProfile({ ...profile, displayName: name.trim() });
      toast.success("Nome aggiornato.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non è andata.");
    } finally {
      setPending(false);
    }
  }

  async function onToggle() {
    setToggling(true);
    try {
      const next = !wants;
      await setWantsUpdates({ data: { wantsUpdates: next } });
      if (profile) onProfile({ ...profile, wantsUpdates: next });
      toast.success(next ? "Riceverai le novità qui." : "Aggiornamenti spenti. Puoi riaccenderli quando vuoi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non è andata.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <Paper>
      <p className="text-xs uppercase tracking-[0.16em] text-muted">Iscrizione</p>
      <h2 className="mt-2 font-display text-2xl tracking-tight">Resta aggiornato</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/75">
        {wants
          ? "Sei iscritto. Quando la Redazione affigge un annuncio o apre una sfida, lo trovi qui al prossimo accesso — con email, Google o X, come preferisci."
          : "Hai spento gli aggiornamenti. Il posto resta tuo: riaccendili se vuoi che le novità ti saltino all'occhio."}
      </p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSave}>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="desk-name" className="text-ink">
            Come ti firmi
          </Label>
          <Input
            id="desk-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
            className="border-line bg-paper-2 text-ink"
          />
        </div>
        <Button type="submit" variant="paper" disabled={pending}>
          {pending ? "Salvo…" : "Salva il nome"}
        </Button>
      </form>
      <button
        type="button"
        disabled={toggling}
        onClick={() => void onToggle()}
        className="mt-5 text-sm text-ink/60 underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
      >
        {toggling ? "Un attimo…" : wants ? "Non voglio più restare aggiornato" : "Voglio restare aggiornato"}
      </button>
    </Paper>
  );
}

function MyLies({ submissions }: { submissions: MySubmission[] }) {
  const router = useRouter();
  if (!submissions.length) {
    return (
      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Le tue bugie</p>
        <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">Ancora nessuna</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/70">
          Quando depositi una bugia in una sfida, resta firmata qui. Così sai cosa hai raccontato, e se ha vinto.
        </p>
        <Link to="/sfide" className="mt-4 inline-flex h-11 items-center text-sm text-cream hover:underline">
          Entra in una sfida
        </Link>
      </section>
    );
  }

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Le tue bugie</p>
      <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">Quello che hai depositato</h2>
      <ul className="mt-6 divide-y divide-border">
        {submissions.map((item) => (
          <li key={item.id} className="py-5">
            <button
              type="button"
              className="w-full text-left"
              onClick={() => void router.navigate({ to: "/sfide/$id", params: { id: String(item.challengeId) } })}
            >
              <div className="flex flex-wrap items-center gap-2">
                {item.isWinner ? <Badge tone="accent">Vincitrice</Badge> : null}
                <Badge tone="muted">{STATUS_LABEL[item.challengeStatus] ?? item.challengeStatus}</Badge>
                <span className="text-xs uppercase tracking-[0.14em] text-muted">{formatDate(item.createdAt)}</span>
              </div>
              <p className="mt-2 font-display text-xl tracking-tight">{item.title}</p>
              <p className="mt-1 text-sm text-cream/70">
                in «{item.challengeTitle}» · {relativeTime(item.createdAt)}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
