import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:bg-accent/90 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]",
        secondary:
          "bg-paper text-ink hover:bg-paper-2",
        ghost:
          "bg-transparent text-cream hover:bg-cream/8",
        outline:
          "border border-border bg-transparent text-cream hover:bg-cream/6",
        paper:
          "bg-ink text-cream hover:bg-ink/90",
        danger:
          "bg-accent/15 text-accent hover:bg-accent/25",
      },
      size: {
        sm: "h-9 rounded-sm px-3 text-sm",
        md: "h-11 rounded-md px-4 text-sm",
        lg: "h-12 rounded-lg px-5 text-base",
        icon: "size-11 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
