import { createFileRoute } from "@tanstack/react-router";
import { CAMPIONATO, PROGRAMMA_2026 } from "@/lib/program";
import { SiteShell, PageHeader } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Paper } from "@/components/cards";

export const Route = createFileRoute("/campionato")({
  component: Campionato,
});

const SEZIONI = [
  {
    name: "Verbale",
    text: "Il Campionato vero e proprio. Si mente in piazza, a voce, di fronte al paese. Domenica 2 agosto alle 16.36, con Leonardo Manera e Alessandro Milan laureati bugiardi ad honorem.",
  },
  {
    name: "Letteraria",
    text: "Racconti, delibere, didascalie. Il Bugiardino d'oro va a chi, sulla carta, riesce a far sembrare vero ciò che non è accaduto. Premiazione sabato 1 agosto.",
  },
  {
    name: "Grafica",
    text: "Immagini in mostra per tutto agosto: bugie italiane e internazionali, più le mostre di Agostino Longo e Marcello Toninelli.",
  },
];

function Campionato() {
  return (
    <SiteShell>
      <PageHeader
        kicker={`${CAMPIONATO.edition}° edizione · ${CAMPIONATO.years}`}
        title="Campionato italiano della Bugia"
        lede="Sabato 1 e domenica 2 agosto 2026, Piazza della Chiesa, Le Piastre. Spettacoli a ingresso gratuito. La cena, invece, si prenota — e si racconta."
      />
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-xl">
          <img
            src="/hero-piazza.jpg"
            alt="La piazza di Le Piastre allestita per la festa"
            className="aspect-video w-full object-cover"
          />
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-2">
          {PROGRAMMA_2026.map((item) => (
            <li key={item.title}>
              <Paper>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">{item.when}</p>
                <h2 className="mt-2 font-display text-xl tracking-tight">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">{item.detail}</p>
              </Paper>
            </li>
          ))}
        </ol>

        <h2 className="mt-16 font-display text-3xl tracking-tight">Tre sezioni, una sola colpa</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {SEZIONI.map((s) => (
            <div key={s.name} className="rounded-xl bg-surface p-5">
              <h3 className="font-display text-xl tracking-tight">{s.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-cream/70">{s.text}</p>
            </div>
          ))}
        </div>

        <Paper className="mt-12">
          <h2 className="font-display text-2xl tracking-tight">Cena bugiarda</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">
            Prenotazioni al {CAMPIONATO.dinnerPhone} oppure al cellulare {CAMPIONATO.dinnerMobile}.
            Spettacoli in piazza a ingresso libero. Per i premi della lotteria: {CAMPIONATO.email}.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`tel:+39${CAMPIONATO.dinnerPhone.replace(/\s/g, "")}`}>
              <Button>Chiama {CAMPIONATO.dinnerPhone}</Button>
            </a>
            <a href={`mailto:${CAMPIONATO.email}`}>
              <Button variant="outline" className="border-line text-ink hover:bg-ink hover:text-cream">
                Scrivi in Accademia
              </Button>
            </a>
          </div>
        </Paper>
      </div>
    </SiteShell>
  );
}
