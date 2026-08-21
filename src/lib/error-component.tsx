import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-cream">
      <div className="max-w-md">
        <TriangleAlert className="mx-auto size-10 text-accent" strokeWidth={1.75} aria-hidden />
        <h1 className="mt-4 font-display text-3xl tracking-tight">Qualcosa è andato storto</h1>
        <p className="mt-3 text-sm break-words leading-relaxed text-cream/70">
          {error.message || "Un imprevisto. Anche le bugie, ogni tanto, inciampano."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center text-sm text-cream/80 underline-offset-4 hover:text-cream hover:underline"
        >
          Torna in piazza
        </Link>
      </div>
    </main>
  );
}
