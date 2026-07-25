import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0 text-[length:var(--text-2xs)] font-semibold uppercase tracking-wide leading-[1.125rem] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        neutral: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border text-foreground",
        success:
          "border-transparent bg-[color-mix(in_oklch,var(--success)_16%,transparent)] text-success",
        warning:
          "border-transparent bg-[color-mix(in_oklch,var(--warning)_16%,transparent)] text-warning",
        info: "border-transparent bg-[color-mix(in_oklch,var(--info)_16%,transparent)] text-info",
        destructive:
          "border-transparent bg-[color-mix(in_oklch,var(--destructive)_16%,transparent)] text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
