import { createFileRoute, Link } from "@tanstack/react-router";
import { listAnnouncements } from "@/lib/server/announcements";
import { SiteShell, PageHeader } from "@/components/site-shell";
import { AnnouncementCard } from "@/components/cards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/annunci")({
  loader: () => listAnnouncements(),
  component: Annunci,
});

function Annunci() {
  const items = Route.useLoaderData();
  return (
    <SiteShell>
      <PageHeader
        kicker="Bacheca"
        title="Annunci della Redazione"
        lede="Quello che il Redattore affigge, lo legge il paese. Niente scorre via: resta qui, anche quando Facebook ha già cambiato umore."
      />
      <div className="mx-auto max-w-3xl space-y-5 px-4 pb-20 sm:px-6">
        {items.length ? (
          items.map((item) => <AnnouncementCard key={item.id} item={item} featured={item.pinned} />)
        ) : (
          <p className="text-cream/70">
            La bacheca è vuota. Il Redattore non ha ancora deciso cosa farvi credere.
          </p>
        )}
        <p className="pt-6 text-sm text-muted">
          Vuoi restare aggiornato?{" "}
          <Link to="/login" search={{ redirect: "/posto" }} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline h-auto px-1")}>
            Entra con le tue credenziali
          </Link>
          {" · "}
          Sei della Redazione?{" "}
          <Link to="/redazione" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline h-auto px-1")}>
            Pubblica un annuncio
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
