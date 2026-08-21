import { createFileRoute } from "@tanstack/react-router";
import { listAlmanac } from "@/lib/server/almanac";
import { CATEGORY_LABEL } from "@/lib/format";
import { SiteShell, PageHeader } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Paper } from "@/components/cards";

export const Route = createFileRoute("/almanacco")({
  loader: () => listAlmanac(),
  component: Almanacco,
});

function Almanacco() {
  const entries = Route.useLoaderData();
  return (
    <SiteShell>
      <div className="relative isolate overflow-hidden">
        <img src="/almanacco.jpg" alt="" className="absolute inset-0 h-72 w-full object-cover opacity-45 sm:h-80" />
        <div className="absolute inset-0 h-72 bg-gradient-to-b from-bg/30 to-bg sm:h-80" />
        <div className="relative">
          <PageHeader
            kicker="Archivio"
            title="Almanacco dei bugiardi"
            lede="Restano le bugie che hanno fatto la storia — e quelle che la storia ha fatto finta di non sentire."
          />
        </div>
      </div>
      <div className="mx-auto max-w-3xl space-y-5 px-4 pb-20 sm:px-6">
        {entries.map((e) => (
          <Paper key={e.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-2xl tabular-nums tracking-tight">{e.year}</span>
              <Badge tone="ink">{CATEGORY_LABEL[e.section] ?? e.section}</Badge>
            </div>
            <h2 className="mt-3 font-display text-2xl tracking-tight">{e.title}</h2>
            <p className="mt-1 text-sm uppercase tracking-[0.14em] text-muted">{e.winnerName}</p>
            <p className="mt-4 text-sm leading-relaxed text-ink/80">{e.body}</p>
          </Paper>
        ))}
      </div>
    </SiteShell>
  );
}
