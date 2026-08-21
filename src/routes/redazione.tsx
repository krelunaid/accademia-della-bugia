import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "@/lib/server/announcements";
import {
  createChallenge,
  deleteChallenge,
  listChallenges,
  setChallengeStatus,
} from "@/lib/server/challenges";
import { claimEditor, getMyProfile } from "@/lib/server/profiles";
import { CATEGORY_LABEL, STATUS_LABEL, formatDate } from "@/lib/format";
import type { Announcement, Challenge, Profile } from "@/lib/types";
import { SiteShell, PageHeader } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Paper } from "@/components/cards";

export const Route = createFileRoute("/redazione")({
  component: Redazione,
});

function Redazione() {
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setReady(true);
      return;
    }
    void getMyProfile()
      .then((p) => {
        setProfile(p);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [user, isPending]);

  if (isPending || !ready) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-3xl px-4 py-20">
          <div className="h-40 animate-pulse rounded-xl bg-surface" />
        </div>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <SiteShell>
      <PageHeader
        kicker="Redazione"
        title={profile?.isEditor ? "La bacheca è tua" : "Il tavolo dei redattori"}
        lede={
          profile?.isEditor
            ? "Pubblica un annuncio quando serve. Apri una sfida quando ti gira. Il paese legge da qui, anche dal telefono."
            : "Solo chi siede in Redazione affigge annunci e apre le sfide. Il primo che arriva prende il tavolo; gli altri bussano col codice."
        }
      />
      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        {profile?.isEditor ? (
          <EditorDesk name={profile.displayName} />
        ) : (
          <ClaimDesk
            defaultName={profile?.displayName ?? user.displayName ?? ""}
            onClaimed={(p) => setProfile(p)}
          />
        )}
      </div>
    </SiteShell>
  );
}

function ClaimDesk({
  defaultName,
  onClaimed,
}: {
  defaultName: string;
  onClaimed: (p: Profile) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await claimEditor({ data: { code: code.trim() || undefined, displayName: name } });
      const p = await getMyProfile();
      if (p) onClaimed(p);
      toast.success("Benvenuto in Redazione.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Codice rifiutato.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Paper>
      <h2 className="font-display text-2xl tracking-tight">Prendi posto</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/75">
        Se la sedia è vuota, basta il nome. Se è già occupata, serve il codice: il paese e
        l'anno di fondazione, tutto attaccato, in maiuscolo.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="dn" className="text-ink">
            Nome in Redazione
          </Label>
          <Input
            id="dn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-line bg-paper-2 text-ink"
            required
            minLength={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code" className="text-ink">
            Codice (se la Redazione è già piena)
          </Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border-line bg-paper-2 text-ink"
            placeholder="paese + anno"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Apro la porta…" : "Entra in Redazione"}
        </Button>
      </form>
    </Paper>
  );
}

function EditorDesk({ name }: { name: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"annunci" | "sfide">("annunci");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  async function reload() {
    const [a, c] = await Promise.all([listAnnouncements(), listChallenges()]);
    setAnnouncements(a);
    setChallenges(c);
    await router.invalidate();
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <p className="text-sm text-cream/70">
        Firmi come <span className="text-cream">{name}</span>. Quello che pubblichi compare subito
        in bacheca e nelle sfide.
      </p>
      <div className="flex gap-2">
        <Button variant={tab === "annunci" ? "primary" : "outline"} onClick={() => setTab("annunci")}>
          Annunci
        </Button>
        <Button variant={tab === "sfide" ? "primary" : "outline"} onClick={() => setTab("sfide")}>
          Sfide
        </Button>
      </div>
      {tab === "annunci" ? (
        <AnnunciEditor items={announcements} onChange={reload} />
      ) : (
        <SfideEditor items={challenges} onChange={reload} />
      )}
    </div>
  );
}

function AnnunciEditor({
  items,
  onChange,
}: {
  items: Announcement[];
  onChange: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(true);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      if (editing) {
        await updateAnnouncement({ data: { id: editing, title, body, pinned } });
        toast.success("Annuncio aggiornato. La bacheca è già al corrente.");
      } else {
        await createAnnouncement({ data: { title, body, pinned } });
        toast.success("Annuncio affisso. Lo vedono tutti, anche dal telefono.");
      }
      setTitle("");
      setBody("");
      setPinned(false);
      setEditing(null);
      await onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non pubblicato.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Paper>
        <h2 className="font-display text-2xl tracking-tight">
          {editing ? "Correggi l'annuncio" : "Nuovo annuncio"}
        </h2>
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="at" className="text-ink">
              Titolo
            </Label>
            <Input
              id="at"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-line bg-paper-2 text-ink"
              required
              minLength={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ab" className="text-ink">
              Testo
            </Label>
            <Textarea
              id="ab"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-36 border-line bg-paper-2 text-ink"
              required
              minLength={8}
            />
          </div>
          <label className="flex h-11 items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="size-4 accent-accent"
            />
            In evidenza in piazza
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Affiggo…" : editing ? "Salva" : "Pubblica in bacheca"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="outline"
                className="border-line text-ink hover:bg-ink hover:text-cream"
                onClick={() => {
                  setEditing(null);
                  setTitle("");
                  setBody("");
                }}
              >
                Annulla
              </Button>
            ) : null}
          </div>
        </form>
      </Paper>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.pinned ? <Badge tone="accent">In evidenza</Badge> : null}
                  <span className="text-xs uppercase tracking-[0.14em] text-muted">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <h3 className="mt-1 font-display text-lg tracking-tight">{item.title}</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(item.id);
                    setTitle(item.title);
                    setBody(item.body);
                    setPinned(item.pinned);
                  }}
                >
                  Modifica
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    try {
                      await deleteAnnouncement({ data: { id: item.id } });
                      toast.success("Tolto dalla bacheca.");
                      await onChange();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Non rimosso.");
                    }
                  }}
                >
                  Togli
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SfideEditor({
  items,
  onChange,
}: {
  items: Challenge[];
  onChange: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<"verbale" | "letteraria" | "grafica" | "libera">("libera");
  const [deadline, setDeadline] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await createChallenge({
        data: {
          title,
          prompt,
          category,
          deadline: deadline || undefined,
        },
      });
      toast.success("Sfida aperta. Chi vuole può già mentire.");
      setTitle("");
      setPrompt("");
      setDeadline("");
      await onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non aperta.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Paper>
        <h2 className="font-display text-2xl tracking-tight">Apri una sfida</h2>
        <p className="mt-2 text-sm text-ink/70">
          Quando vuoi. Un titolo, una consegna, una scadenza se ti serve. Compare subito tra le
          sfide aperte.
        </p>
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="ct" className="text-ink">
              Titolo
            </Label>
            <Input
              id="ct"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-line bg-paper-2 text-ink"
              required
              minLength={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp" className="text-ink">
              Consegna
            </Label>
            <Textarea
              id="cp"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-36 border-line bg-paper-2 text-ink"
              required
              minLength={12}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat" className="text-ink">
                Sezione
              </Label>
              <select
                id="cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="flex h-11 w-full rounded-md border border-line bg-paper-2 px-3.5 text-sm text-ink"
              >
                <option value="libera">Libera</option>
                <option value="verbale">Verbale</option>
                <option value="letteraria">Letteraria</option>
                <option value="grafica">Grafica</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dl" className="text-ink">
                Scadenza (facoltativa)
              </Label>
              <Input
                id="dl"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="border-line bg-paper-2 text-ink"
              />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Apro…" : "Pubblica la sfida"}
          </Button>
        </form>
      </Paper>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={item.status === "aperta" ? "accent" : "muted"}>
                {STATUS_LABEL[item.status]}
              </Badge>
              <Badge tone="live">{CATEGORY_LABEL[item.category]}</Badge>
              <span className="text-xs text-muted">
                {item.submissionCount} {item.submissionCount === 1 ? "bugia" : "bugie"}
              </span>
            </div>
            <h3 className="mt-2 font-display text-lg tracking-tight">
              <Link to="/sfide/$id" params={{ id: String(item.id) }} className="hover:text-accent">
                {item.title}
              </Link>
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.status === "aperta" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await setChallengeStatus({ data: { id: item.id, status: "chiusa" } });
                    toast.success("Sfida chiusa. Niente più depositi.");
                    await onChange();
                  }}
                >
                  Chiudi
                </Button>
              ) : item.status === "chiusa" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await setChallengeStatus({ data: { id: item.id, status: "aperta" } });
                    toast.success("Riaperta.");
                    await onChange();
                  }}
                >
                  Riapri
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  try {
                    await deleteChallenge({ data: { id: item.id } });
                    toast.success("Sfida tolta.");
                    await onChange();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Non tolta.");
                  }
                }}
              >
                Elimina
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
