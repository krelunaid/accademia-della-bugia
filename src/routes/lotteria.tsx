import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listLotteryPrizes, lookupTicket } from "@/lib/server/lottery";
import { CAMPIONATO } from "@/lib/program";
import { SiteShell, PageHeader } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Paper } from "@/components/cards";
import type { LotteryPrize } from "@/lib/types";

export const Route = createFileRoute("/lotteria")({
  loader: () => listLotteryPrizes(),
  component: Lotteria,
});

function Lotteria() {
  const prizes = Route.useLoaderData();
  const [code, setCode] = useState("");
  const [hit, setHit] = useState<LotteryPrize | null | "empty">(null);
  const [pending, setPending] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, LotteryPrize[]>();
    for (const p of prizes) {
      const key = p.prize;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [prizes]);

  async function onLookup(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const found = await lookupTicket({ data: { code } });
      setHit(found ?? "empty");
    } finally {
      setPending(false);
    }
  }

  return (
    <SiteShell>
      <div className="relative isolate overflow-hidden">
        <img src="/lotteria.jpg" alt="" className="absolute inset-0 h-72 w-full object-cover opacity-40 sm:h-80" />
        <div className="absolute inset-0 h-72 bg-gradient-to-b from-bg/20 to-bg sm:h-80" />
        <div className="relative">
          <PageHeader
            kicker="Riffa 2026"
            title="Lotteria della Bugia"
            lede="Cercate il vostro numero. Il sito storico non si leggeva dal telefono: qui sì. I premi veri si ritirano scrivendo in Accademia; quelli immaginari, con un po' di immaginazione."
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <Paper>
          <h2 className="font-display text-2xl tracking-tight">Hai un numero?</h2>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onLookup}>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              placeholder="Es. 963"
              className="border-line bg-paper-2 text-ink"
              aria-label="Numero del biglietto"
            />
            <Button type="submit" disabled={pending || !code.trim()}>
              {pending ? "Cerco…" : "Cerca"}
            </Button>
          </form>
          {hit === "empty" ? (
            <p className="mt-4 text-sm text-ink/70">
              Questo numero non è uscito. O è sfortuna, o è una bugia che non ha convinto la ruota.
            </p>
          ) : hit ? (
            <div className="mt-5 rounded-lg bg-paper-2 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">N. {hit.ticketCode}</p>
              <p className="mt-1 font-display text-xl tracking-tight">{hit.prize}</p>
              {hit.sponsor ? <p className="mt-1 text-sm text-ink/70">{hit.sponsor}</p> : null}
              {hit.claimed ? <Badge tone="muted" className="mt-3">Già ritirato</Badge> : null}
              {hit.sponsor === "Sezione premi immaginari" ? (
                <p className="mt-3 text-sm italic text-ink/70">
                  Premio della sezione immaginaria. Ritiro: dove finisce la strada e comincia il racconto.
                </p>
              ) : (
                <p className="mt-3 text-sm text-ink/70">
                  Per ritirarlo:{" "}
                  <a className="underline" href={`mailto:${CAMPIONATO.email}`}>
                    {CAMPIONATO.email}
                  </a>
                </p>
              )}
            </div>
          ) : null}
        </Paper>

        <h2 className="mt-14 font-display text-2xl tracking-tight">I numeri estratti</h2>
        <p className="mt-2 text-sm text-cream/65">
          Estrazione del 2 agosto 2026, Piazza della Chiesa, ore 22.38 circa.
        </p>
        <div className="mt-8 space-y-8">
          {groups.map(([prize, list]) => (
            <div key={prize}>
              <h3 className="font-display text-lg tracking-tight">{prize}</h3>
              {list[0]?.sponsor ? (
                <p className="text-sm text-muted">{list[0].sponsor}</p>
              ) : null}
              <ul className="mt-3 flex flex-wrap gap-2">
                {list.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-md bg-raised px-2.5 py-1.5 font-mono text-sm tabular-nums text-cream/90"
                  >
                    {p.ticketCode}
                    {p.claimed ? <span className="ml-1 text-muted">·</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
