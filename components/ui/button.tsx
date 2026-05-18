import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] dark:focus-visible:ring-red-900/30",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-sm hover:bg-primary-hover",
        outline:
          "border border-neutral-200 bg-surface text-heading shadow-sm hover:bg-neutral-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/70",
        ghost:
          "text-muted hover:bg-neutral-100 hover:text-heading dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
        destructive:
          "bg-danger text-white shadow-sm hover:bg-primary-hover",
        secondary:
          "bg-surface-secondary text-heading hover:bg-neutral-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
