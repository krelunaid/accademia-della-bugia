import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Share, Plus, Download } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Paper } from "@/components/cards";
import { cn } from "@/lib/utils";

type BeforeInstall = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return media || ios;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function useInstalled() {
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    setInstalled(isStandalone());
    const onChange = () => setInstalled(isStandalone());
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return installed;
}

export function InstallCard({ compact = false }: { compact?: boolean }) {
  const installed = useInstalled();
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  const [ios, setIos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIos(isIos());
    const onBip = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstall);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (installed || done) {
    if (compact) return null;
    return (
      <Paper>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Sul telefono</p>
        <h2 className="mt-2 font-display text-2xl tracking-tight">È già sulla Home</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">
          L'Accademia è un'app: icona, schermo intero, senza barra del browser.
        </p>
      </Paper>
    );
  }

  if (compact) {
    return (
      <Link to="/altro" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
        Installa l'app su iPhone e Android
      </Link>
    );
  }

  async function onInstall() {
    if (deferred) {
      setBusy(true);
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") setDone(true);
      } finally {
        setBusy(false);
        setDeferred(null);
      }
      return;
    }
    if (ios) {
      window.location.assign("/?install=1&platform=ios");
    }
  }

  return (
    <Paper>
      <div className="flex items-start gap-3">
        <img
          src="/icon-192.png"
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-2xl"
        />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">iPhone e Android</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">Metti l'app sulla Home</h2>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink/75">
        Non è un sito da sfogliare nel browser. Una volta installata, si apre come
        WhatsApp o Instagram: sulla Home compare il Bugiardino d'oro.
      </p>

      <div className="mt-5 space-y-4 text-sm text-ink/80">
        <div>
          <p className="font-medium text-ink">iPhone</p>
          <ol className="mt-2 space-y-2">
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink/8">
                <Share className="size-4" />
              </span>
              <span className="pt-1">Safari → Condividi, in basso al centro.</span>
            </li>
            <li className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink/8">
                <Plus className="size-4" />
              </span>
              <span className="pt-1">«Aggiungi alla schermata Home», poi Aggiungi.</span>
            </li>
          </ol>
        </div>
        <div>
          <p className="font-medium text-ink">Android</p>
          <p className="mt-2">Chrome → menu (tre puntini) → Installa app. Conferma.</p>
        </div>
      </div>

      {deferred ? (
        <Button className="mt-5 w-full" variant="paper" disabled={busy} onClick={() => void onInstall()}>
          <Download className="size-4" />
          {busy ? "Un attimo…" : "Installa l'app"}
        </Button>
      ) : ios ? (
        <Button className="mt-5 w-full" variant="paper" onClick={() => void onInstall()}>
          <Download className="size-4" />
          Apri le istruzioni
        </Button>
      ) : null}
    </Paper>
  );
}
