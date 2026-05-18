"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/hooks/useCart";

const links = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/products", label: "Products", icon: Package },
  { href: "/cart", label: "Cart", icon: ShoppingCart, showBadge: true },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
];

export function CustomerBottomNav() {
  const pathname = usePathname();
  const itemCount = useCart((s) => s.totalItems());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200/80 bg-surface/95 pb-safe backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-lg justify-around px-2">
        {links.map(({ href, label, icon: Icon, showBadge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary dark:text-red-400" : "text-muted dark:text-zinc-500"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active && "bg-primary-soft dark:bg-red-950/40"
                )}
              >
                <Icon className="h-5 w-5" />
                {showBadge && itemCount > 0 && (
                  <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
