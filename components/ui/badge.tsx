import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary:
          "border-neutral-200 bg-surface-secondary text-heading dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
        pending:
          "border-amber-200 bg-warning-soft text-warning dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400",
        confirmed:
          "border-blue-200 bg-info-soft text-info dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400",
        delivered:
          "border-green-200 bg-success-soft text-success dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-400",
        cancelled:
          "border-red-200 bg-danger-soft text-danger dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400",
        outline:
          "border-neutral-200 bg-surface text-muted dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
