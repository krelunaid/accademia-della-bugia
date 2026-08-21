import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <img
      src="/icon-192.png"
      alt=""
      width={32}
      height={32}
      className={cn("size-8 shrink-0 rounded-lg", className)}
    />
  );
}
