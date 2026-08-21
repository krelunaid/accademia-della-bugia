import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { listAnnouncements } from "@/lib/server/announcements";
import { listChallenges } from "@/lib/server/challenges";
import { CAMPIONATO } from "@/lib/program";
import { SiteShell } from "@/components/site-shell";
import { AnnouncementCard, ChallengeCard } from "@/components/cards";
import { InstallCard } from "@/components/install-app";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignedIn, SignedOut } from "@/lib/auth/gates";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [announcements, challenges] = await Promise.all([
      listAnnouncements(),
      listChallenges(),
    ]);
    return { announcements, challenges };
  },
  component: Home,
  pendingComponent: HomePending,
});

function HomePending() {
  return (
    <SiteShell>
      <div className="h-48 animate-pulse bg-surface" />
    </SiteShell>
  );
}

function Home() {
  const { announcements, challenges } = Route.useLoaderData();
  const pinned = announcements.filter((a) => a.pinned)[0];
  const open = challenges.filter((c) => c.status === "aperta").slice(0, 2);

  return (
    <SiteShell>
      <section className="relative mx-4 mt-4 overflow-hidden rounded-xl">
        <img
          src="/hero-piazza.jpg"
          alt="Piazza della Chiesa a Le Piastre"
          className="aspect-video w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-cream/80">
            {CAMPIONATO.place} · {CAMPIONATO.years}
          </p>
          <h1 className="mt-1 font-display text-3xl leading-none tracking-tight text-cream">
            Accademia della Bugia
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        <InstallCard compact />

        <div className="grid grid-cols-2 gap-2">
          <Link to="/sfide" className={cn(buttonVariants({ size: "lg" }), "h-12")}>
            Sfide
            <ArrowRight className="size-4" />
          </Link>
          <Link to="/lotteria" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-12")}>
            Lotteria
          </Link>
        </div>

        <SignedOut>
          <Link to="/login" search={{ redirect: "/posto" }} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Entra per restare aggiornato
          </Link>
        </SignedOut>
        <SignedIn>
          <Link to="/posto" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Vai al tuo posto
          </Link>
        </SignedIn>

        {pinned ? (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-display text-xl tracking-tight">In evidenza</h2>
              <Link to="/annunci" className="text-sm text-cream/70">
                Bacheca
              </Link>
            </div>
            <AnnouncementCard item={pinned} featured />
          </section>
        ) : null}

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl tracking-tight">Sfide aperte</h2>
            <Link to="/sfide" className="text-sm text-cream/70">
              Tutte
            </Link>
          </div>
          <div className="grid gap-3">
            {open.length ? (
              open.map((item) => <ChallengeCard key={item.id} item={item} />)
            ) : (
              <p className="text-sm text-muted">Nessuna sfida aperta. La Redazione sta pensando.</p>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
