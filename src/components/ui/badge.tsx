import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "muted",
  children,
}: {
  className?: string;
  tone?: "muted" | "accent" | "paper" | "live" | "ink";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.14em]",
        tone === "muted" && "bg-cream/8 text-muted",
        tone === "accent" && "bg-accent text-accent-fg",
        tone === "paper" && "bg-paper text-ink",
        tone === "live" && "bg-cream/10 text-cream",
        tone === "ink" && "bg-ink/10 text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
