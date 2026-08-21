import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteShell } from "@/components/site-shell";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const next = redirect && redirect.startsWith("/") ? redirect : "/posto";
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name: name.trim() || "Iscritto" });
        if (res.error) throw new Error(res.error.message || "Registrazione non riuscita.");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message || "Accesso non riuscito.");
      }
      await navigate({ to: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Qualcosa non ha funzionato.");
    } finally {
      setPending(false);
    }
  }

  return (
    <SiteShell bare>
      <div className="relative isolate min-h-dvh">
        <img src="/marionette.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-bg/70" />
        <div className="relative mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
          <div className="rounded-xl bg-surface p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Accesso</p>
            <h1 className="mt-2 font-display text-3xl tracking-tight">Entra in Accademia</h1>
            <p className="mt-2 text-sm text-cream/70">
              {authEnabled
                ? "Google, X, oppure email e password. Così resti aggiornato su bacheca, sfide e il Campionato."
                : "L'accesso è momentaneamente chiuso."}
            </p>

            {authEnabled ? (
              <div className="mt-8 space-y-3">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn(p.providerId, { callbackURL: next })}
                  >
                    Continua con {p.label}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">L'accesso non è disponibile.</p>
            )}

            {authEnabled ? (
              <>
                <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted">
                  <span className="h-px flex-1 bg-border" />
                  oppure
                  <span className="h-px flex-1 bg-border" />
                </div>
                <form className="space-y-4" onSubmit={onEmail}>
                  {mode === "up" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nome in Accademia</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        placeholder="Come vuoi firmare le bugie"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "up" ? "new-password" : "current-password"}
                    />
                  </div>
                  {error ? <p className="text-sm text-accent">{error}</p> : null}
                  <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? "Un attimo…" : mode === "up" ? "Registrati" : "Entra"}
                  </Button>
                </form>
                <button
                  type="button"
                  className="mt-4 text-sm text-cream/70 underline-offset-4 hover:text-cream hover:underline"
                  onClick={() => {
                    setMode((m) => (m === "in" ? "up" : "in"));
                    setError(null);
                  }}
                >
                  {mode === "in" ? "Non hai un posto? Registrati." : "Hai già un posto? Entra."}
                </button>
              </>
            ) : null}

            <p className="mt-8 text-sm text-muted">
              Dopo l'accesso si apre il tuo posto: lì restano bacheca e sfide nuove.
              {" · "}
              <Link to="/" className="hover:text-cream">
                Torna in piazza
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
