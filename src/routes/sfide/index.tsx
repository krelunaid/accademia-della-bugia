import { createFileRoute, Link } from "@tanstack/react-router";
import { listChallenges } from "@/lib/server/challenges";
import { SiteShell, PageHeader } from "@/components/site-shell";
import { ChallengeCard } from "@/components/cards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sfide/")({
  loader: () => listChallenges(),
  component: Sfide,
});

function Sfide() {
  const items = Route.useLoaderData();
  const open = items.filter((c) => c.status === "aperta");
  const closed = items.filter((c) => c.status !== "aperta");

  return (
    <SiteShell>
      <PageHeader
        kicker="Prove"
        title="Le sfide dell'Accademia"
        lede="Il Redattore le apre quando gli pare. Tu ci metti una bugia. Il paese legge, e ogni tanto crede."
      />
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {open.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((item) => (
              <ChallengeCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-cream/70">Nessuna sfida aperta. La Redazione sta ruminando.</p>
        )}

        {closed.length ? (
          <>
            <h2 className="mt-16 font-display text-2xl tracking-tight">Chiuse o già giudicate</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {closed.map((item) => (
                <ChallengeCard key={item.id} item={item} />
              ))}
            </div>
          </>
        ) : null}

        <p className="mt-12 text-sm text-muted">
          Redazione:{" "}
          <Link to="/redazione" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline h-auto px-1")}>
            apri una sfida nuova
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
