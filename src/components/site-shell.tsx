import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Feather, Landmark, Megaphone, Ellipsis, Ticket } from "lucide-react";
import { Mark } from "@/components/mark";
import { AuthSlot } from "@/components/auth-slot";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Piazza", icon: Landmark, active: (p: string) => p === "/" },
  { to: "/annunci", label: "Bacheca", icon: Megaphone, active: (p: string) => p.startsWith("/annunci") },
  { to: "/sfide", label: "Sfide", icon: Feather, active: (p: string) => p.startsWith("/sfide") },
  { to: "/lotteria", label: "Lotteria", icon: Ticket, active: (p: string) => p.startsWith("/lotteria") },
  { to: "/altro", label: "Altro", icon: Ellipsis, active: (p: string) => ALTRO.has(p.split("/")[1] ?? "") },
] as const;

const ALTRO = new Set(["altro", "almanacco", "campionato", "redazione", "posto"]);

export function SiteShell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-bg text-cream">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        <a
          href="#contenuto"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-paper focus:px-3 focus:py-2 focus:text-ink"
        >
          Vai al contenuto
        </a>
        <header className="sticky top-0 z-40 border-b border-border bg-bg pt-safe">
          <div className="flex h-14 items-center gap-2 px-3">
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <Mark className="size-8" />
              <span className="truncate font-display text-base leading-none tracking-tight">
                Accademia della Bugia
              </span>
            </Link>
            <div className="ml-auto">
              <AuthSlot />
            </div>
          </div>
        </header>
        <main id="contenuto" className={cn("flex-1", bare ? "pb-safe" : "pb-tabbar")}>
          {children}
        </main>
        {bare ? null : (
          <nav
            className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-border bg-bg pb-safe"
            aria-label="App"
          >
            <ul className="grid h-14 grid-cols-5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const on = tab.active(pathname);
                return (
                  <li key={tab.to} className="min-w-0">
                    <Link
                      to={tab.to}
                      className={cn(
                        "flex h-14 flex-col items-center justify-center gap-0.5 whitespace-nowrap text-xs font-medium",
                        on ? "text-cream" : "text-muted",
                      )}
                    >
                      <Icon className="size-5" strokeWidth={on ? 2.2 : 1.8} />
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  lede,
}: {
  kicker?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="px-4 pb-5 pt-6">
      {kicker ? (
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{kicker}</p>
      ) : null}
      <h1 className="mt-1 font-display text-3xl leading-tight tracking-tight text-cream">
        {title}
      </h1>
      {lede ? <p className="mt-3 max-w-prose text-sm leading-relaxed text-cream/70">{lede}</p> : null}
    </header>
  );
}
