"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function CustomerHeader() {
  const itemCount = useCart((s) => s.totalItems());

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-surface/90 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <Link href="/home" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
            M
          </span>
          <span className="text-sm font-semibold text-heading">
            MAHADEV
          </span>
        </Link>
        <ThemeToggle />
        <Link
          href="/cart"
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
            itemCount > 0
              ? "bg-primary-soft text-primary"
              : "text-muted hover:bg-neutral-100 hover:text-heading dark:hover:bg-zinc-800"
          )}
          aria-label={`Cart, ${itemCount} items`}
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
