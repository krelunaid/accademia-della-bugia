import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Flag, Newspaper, PenLine, UserRound, LogOut } from "lucide-react";
import { SiteShell, PageHeader } from "@/components/site-shell";
import { InstallCard } from "@/components/install-app";
import { authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CAMPIONATO } from "@/lib/program";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/altro")({
  component: Altro,
});

const LINKS = [
  { to: "/posto", label: "Il tuo posto", hint: "Novità e iscrizione", icon: UserRound },
  { to: "/campionato", label: "Campionato", hint: "Programma del 50°", icon: Flag },
  { to: "/almanacco", label: "Almanacco", hint: "Le bugie che restano", icon: BookOpen },
  { to: "/redazione", label: "Redazione", hint: "Annunci e sfide", icon: PenLine },
  { to: "/annunci", label: "Bacheca", hint: "Tutto quello affisso", icon: Newspaper },
] as const;

function Altro() {
  const { user, isPending } = useCurrentUserState();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <SiteShell>
      <PageHeader kicker="Menu" title="Altro" lede="Installazione, il tuo posto, il Campionato e chi scrive gli annunci." />
      <div className="mx-auto max-w-lg space-y-4 px-4 pb-8">
        <InstallCard />

        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface">
          {LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link to={item.to} className="flex min-h-14 items-center gap-3 px-4 py-3">
                  <Icon className="size-5 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-cream">{item.label}</span>
                    <span className="block text-xs text-muted">{item.hint}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {isPending ? null : user && authEnabled ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut().catch(() => setSigningOut(false));
            }}
          >
            <LogOut className="size-4" />
            {signingOut ? "Esco…" : "Esci"}
          </Button>
        ) : (
          <Link to="/login" search={{ redirect: "/posto" }} className={cn(buttonVariants(), "w-full")}>
            Entra con le tue credenziali
          </Link>
        )}

        <section className="pt-4 text-sm text-muted">
          <p className="text-xs uppercase tracking-[0.16em]">Contatti</p>
          <ul className="mt-3 space-y-2 text-cream/80">
            <li>
              <a href={`mailto:${CAMPIONATO.email}`}>{CAMPIONATO.email}</a>
            </li>
            <li>
              <a href={`tel:+39${CAMPIONATO.dinnerPhone.replace(/\s/g, "")}`}>Cena · {CAMPIONATO.dinnerPhone}</a>
            </li>
            <li>Piazza della Chiesa, {CAMPIONATO.place}</li>
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
