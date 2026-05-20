"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, LogOut, Search, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  loadDashboardData,
  type DashboardPayload,
} from "@/lib/actions/dashboard.actions";
import { getOrderCustomerName } from "@/lib/utils/order";

type AdminNotification = {
  id: string;
  message: string;
  href: string;
};

function buildAdminNotifications(data: DashboardPayload): AdminNotification[] {
  const items: AdminNotification[] = [];

  for (const product of data.outOfStockProducts) {
    items.push({
      id: `oos-${product.id}`,
      message: `${product.name} is out of stock`,
      href: "/inventory",
    });
  }

  for (const product of data.lowStockProducts) {
    items.push({
      id: `low-${product.id}`,
      message: `${product.name} is low on stock`,
      href: "/inventory",
    });
  }

  if (data.metrics.pending_orders > 0) {
    items.push({
      id: "pending-summary",
      message: `${data.metrics.pending_orders} pending order${
        data.metrics.pending_orders === 1 ? "" : "s"
      } awaiting confirmation`,
      href: "/admin/orders",
    });
  }

  for (const order of data.recentOrders.filter((o) => o.status === "pending")) {
    const customer = getOrderCustomerName(order);
    items.push({
      id: `new-order-${order.id}`,
      message: `New order received: ${order.order_number}${
        customer !== "—" ? ` from ${customer}` : ""
      }`,
      href: `/admin/orders/${order.id}`,
    });
  }

  return items;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  products: "Products",
  inventory: "Inventory",
  orders: "Orders",
  customers: "Customers",
  categories: "Categories",
  new: "New",
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] ?? seg.replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

export function AdminTopbar({
  onMenuClick,
  sidebarCollapsed,
}: {
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = buildBreadcrumbs(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const data = await loadDashboardData();
      setNotifications(buildAdminNotifications(data));
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setNotificationsOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [notificationsOpen]);

  useEffect(() => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (notificationsOpen) void refreshNotifications();
  }, [notificationsOpen, refreshNotifications]);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (data?.full_name) setAdminName(data.full_name);
    }
    loadProfile();
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-neutral-200 bg-surface/95 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-6",
        sidebarCollapsed && "lg:pl-4"
      )}
    >
      {onMenuClick && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <span className="sr-only">Menu</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      )}

      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 md:block">
        <ol className="flex items-center gap-1 text-sm text-muted">
          <li>
            <span className="font-medium text-heading">MAHADEV</span>
          </li>
          {crumbs.map((crumb) => (
            <li key={crumb.href} className="flex items-center gap-1 capitalize">
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 dark:text-zinc-600" />
              <span
                className={cn(
                  crumb.isLast ? "font-medium text-heading" : "text-muted"
                )}
              >
                {crumb.label}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="relative ml-auto hidden max-w-xs flex-1 sm:block lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          type="search"
          placeholder="Search orders, products…"
          className="h-10 rounded-xl border-neutral-200 bg-surface-secondary pl-9 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          aria-label="Global search"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        <ThemeToggle />
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative rounded-xl text-muted hover:text-heading"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-zinc-900" />
          </Button>

          {notificationsOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close notifications"
                onClick={() => setNotificationsOpen(false)}
              />
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-neutral-200 bg-surface py-1 shadow-lift animate-in fade-in-0 zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900/95 dark:backdrop-blur-xl dark:shadow-dark-lift"
              >
                <p className="border-b border-neutral-100 px-4 py-2.5 text-sm font-medium text-heading dark:border-zinc-800">
                  Notifications
                </p>
                {notificationsLoading ? (
                  <p className="px-4 py-6 text-center text-sm text-muted">
                    Loading…
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted">
                    No new notifications
                  </p>
                ) : (
                  <ul
                    className="max-h-[min(280px,70vh)] overflow-y-auto"
                    aria-label="Admin alerts"
                  >
                    {notifications.map((item) => (
                      <li
                        key={item.id}
                        className="border-b border-neutral-100 last:border-b-0 dark:border-zinc-800"
                      >
                        <Link
                          href={item.href}
                          className="block px-4 py-2.5 text-sm text-muted hover:bg-neutral-50 hover:text-heading dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          {item.message}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 sm:px-3"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
              <User className="h-4 w-4" />
            </span>
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-heading sm:inline">
              {adminName}
            </span>
          </Button>

          {profileOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close profile menu"
                onClick={() => setProfileOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-neutral-200 bg-surface py-1 shadow-lift animate-in fade-in-0 zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900/95 dark:backdrop-blur-xl dark:shadow-dark-lift"
              >
                <p className="border-b border-neutral-100 px-4 py-2.5 text-sm font-medium text-heading dark:border-zinc-800">
                  {adminName}
                </p>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-neutral-50 hover:text-heading dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
