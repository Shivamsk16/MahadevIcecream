"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Tags,
  LogOut,
  X,
  ChevronLeft,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/categories", label: "Categories", icon: Tags },
];

export function AdminSidebar({
  className,
  onNavigate,
  showClose,
  collapsed,
  onToggleCollapse,
}: {
  className?: string;
  onNavigate?: () => void;
  showClose?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-neutral-200 bg-surface transition-[width] duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-900",
        collapsed ? "w-[72px]" : "w-64",
        className
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-neutral-200 px-4 dark:border-zinc-800",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/dashboard" onClick={onNavigate} className="min-w-0">
            <p className="truncate text-sm font-semibold text-heading">
              MAHADEV
            </p>
            <p className="text-xs text-muted">Admin Console</p>
          </Link>
        )}
        {collapsed && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
            M
          </span>
        )}
        <div className="flex items-center gap-1">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden rounded-lg p-1.5 text-muted hover:bg-neutral-100 hover:text-heading dark:hover:bg-zinc-800 lg:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  collapsed && "rotate-180"
                )}
              />
            </button>
          )}
          {showClose && (
            <button
              type="button"
              onClick={onNavigate}
              className="rounded-lg p-1.5 text-muted hover:bg-neutral-100 dark:hover:bg-zinc-800 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              className={cn(
                "nav-link",
                active && "nav-link-active",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={logout}
          className={cn(
            "nav-link w-full text-left",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
