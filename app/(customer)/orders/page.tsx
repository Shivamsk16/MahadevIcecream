"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  History,
  ReceiptText,
} from "lucide-react";

type OrdersTab = "pending" | "delivered";
type DisplayOrderStatus =
  | Order["status"]
  | "preparing"
  | "out_for_delivery";

const pendingStatuses = new Set<string>([
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
]);

const deliveredStatuses = new Set<string>(["delivered", "cancelled"]);

const progressSteps: { status: DisplayOrderStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "confirmed", label: "Confirmed" },
  { status: "preparing", label: "Preparing" },
  { status: "out_for_delivery", label: "On the way" },
];

function getOrderStatus(order: Order): DisplayOrderStatus {
  return order.status as DisplayOrderStatus;
}

function getItemSummary(order: Order) {
  const count = order.order_items?.length ?? 0;
  return `${count} ${count === 1 ? "item" : "items"}`;
}

function OrderProgress({ status }: { status: DisplayOrderStatus }) {
  const activeIndex = Math.max(
    0,
    progressSteps.findIndex((step) => step.status === status)
  );

  return (
    <div className="mt-4 rounded-2xl bg-neutral-50/80 p-3 dark:bg-zinc-900/70">
      <div className="grid grid-cols-4 gap-2">
        {progressSteps.map((step, index) => {
          const isActive = index <= activeIndex;

          return (
            <div key={step.status} className="min-w-0">
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-500",
                  isActive
                    ? "bg-primary shadow-[0_0_0_3px_rgba(220,38,38,0.08)]"
                    : "bg-neutral-200 dark:bg-zinc-700"
                )}
              />
              <span
                className={cn(
                  "mt-2 block truncate text-[10px] font-medium",
                  isActive ? "text-heading" : "text-muted"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrdersTabs({
  activeTab,
  pendingCount,
  deliveredCount,
  onChange,
}: {
  activeTab: OrdersTab;
  pendingCount: number;
  deliveredCount: number;
  onChange: (tab: OrdersTab) => void;
}) {
  const tabs = [
    {
      id: "pending" as const,
      label: "Pending Orders",
      count: pendingCount,
      icon: Clock3,
    },
    {
      id: "delivered" as const,
      label: "Delivered Orders",
      count: deliveredCount,
      icon: History,
    },
  ];

  return (
    <div className="sticky top-[65px] z-30 -mx-4 border-b border-neutral-200/70 bg-background/95 px-4 py-3 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95 sm:-mx-5 sm:px-5">
      <div className="grid grid-cols-2 rounded-2xl bg-neutral-100 p-1 shadow-inner dark:bg-zinc-900">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-medium transition-all duration-300 active:scale-[0.98]",
                isActive
                  ? "bg-surface text-heading shadow-sm dark:bg-zinc-800"
                  : "text-muted hover:text-heading"
              )}
              aria-pressed={isActive}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] transition-colors",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "bg-white/70 text-muted dark:bg-zinc-800"
                )}
              >
                {tab.count}
              </span>
              {isActive && (
                <motion.span
                  layoutId="orders-active-underline"
                  className="absolute inset-x-5 -bottom-1 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  emphasis = "active",
  onToggle,
}: {
  order: Order;
  expanded: boolean;
  emphasis?: "active" | "history";
  onToggle: () => void;
}) {
  const status = getOrderStatus(order);
  const isActiveCard = emphasis === "active";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "overflow-hidden rounded-3xl border bg-surface transition-all duration-300 dark:bg-zinc-900",
        isActiveCard
          ? "border-primary/20 p-4 shadow-lift shadow-red-900/5 hover:border-primary/35 dark:border-red-900/40 dark:shadow-dark-lift"
          : "border-neutral-200 p-3 shadow-sm hover:border-neutral-300 dark:border-zinc-800"
      )}
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <section className="flex items-start justify-between gap-3">
          <section className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-xl",
                  isActiveCard
                    ? "h-9 w-9 bg-primary-soft text-primary"
                    : "h-8 w-8 bg-neutral-100 text-muted dark:bg-zinc-800"
                )}
              >
                <ReceiptText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate font-semibold tracking-tight text-heading",
                    isActiveCard ? "text-sm" : "text-[13px]"
                  )}
                >
                  {order.order_number}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDate(order.placed_at)}
                </p>
              </div>
            </div>
          </section>

          <section className="flex shrink-0 items-center gap-2">
            <OrderStatusBadge status={status} />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-muted transition-colors dark:bg-zinc-800">
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </section>
        </section>

        <section
          className={cn(
            "mt-4 grid grid-cols-2 gap-3 rounded-2xl",
            isActiveCard
              ? "bg-primary-soft/60 p-3 dark:bg-red-950/20"
              : "bg-neutral-50 p-2.5 dark:bg-zinc-800/60"
          )}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Items
            </p>
            <p className="mt-1 text-sm font-semibold text-heading">
              {getItemSummary(order)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Total
            </p>
            <p
              className={cn(
                "mt-1 font-bold tabular-nums",
                isActiveCard ? "text-base text-primary" : "text-sm text-heading"
              )}
            >
              {formatCurrency(order.net_amount)}
            </p>
          </div>
        </section>

        {isActiveCard && <OrderProgress status={status} />}
      </button>

      <AnimatePresence initial={false}>
        {expanded && order.order_items && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-4 space-y-2 overflow-hidden border-t border-neutral-100 pt-4 text-sm dark:border-zinc-800"
          >
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-muted">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-heading">
                  {formatCurrency(item.line_total)}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrdersTab>("pending");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("placed_at", { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const { pendingOrders, deliveredOrders, cancelledOrders } = useMemo(() => {
    return {
      pendingOrders: orders.filter((order) =>
        pendingStatuses.has(getOrderStatus(order))
      ),
      deliveredOrders: orders.filter((order) => getOrderStatus(order) === "delivered"),
      cancelledOrders: orders.filter((order) => getOrderStatus(order) === "cancelled"),
    };
  }, [orders]);

  const deliveredHistory = useMemo(
    () => orders.filter((order) => deliveredStatuses.has(getOrderStatus(order))),
    [orders]
  );

  if (loading) {
    return (
      <section className="flex justify-center py-16">
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <section className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Ice cream delivery
        </p>
        <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
        <p className="text-sm text-muted">
          Track active orders separately from your order history.
        </p>
      </section>

      <OrdersTabs
        activeTab={activeTab}
        pendingCount={pendingOrders.length}
        deliveredCount={deliveredHistory.length}
        onChange={(tab) => {
          setActiveTab(tab);
          setExpanded(null);
        }}
      />

      <AnimatePresence mode="wait">
        {activeTab === "pending" ? (
          <motion.section
            key="pending-orders"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-4"
          >
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expanded === order.id}
                  onToggle={() =>
                    setExpanded(expanded === order.id ? null : order.id)
                  }
                />
              ))
            ) : (
              <EmptyState
                title="No active orders right now"
                description="Fresh scoops you order will appear here with live status updates."
                actionLabel="Browse Products"
                actionHref="/products"
              />
            )}
          </motion.section>
        ) : (
          <motion.section
            key="delivered-orders"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-5"
          >
            {deliveredHistory.length > 0 ? (
              <>
                {deliveredOrders.length > 0 && (
                  <section className="space-y-3">
                    <p className="section-label">Delivered</p>
                    {deliveredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        emphasis="history"
                        expanded={expanded === order.id}
                        onToggle={() =>
                          setExpanded(expanded === order.id ? null : order.id)
                        }
                      />
                    ))}
                  </section>
                )}

                {cancelledOrders.length > 0 && (
                  <section className="space-y-3">
                    <p className="section-label">Cancelled</p>
                    {cancelledOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        emphasis="history"
                        expanded={expanded === order.id}
                        onToggle={() =>
                          setExpanded(expanded === order.id ? null : order.id)
                        }
                      />
                    ))}
                  </section>
                )}
              </>
            ) : (
              <EmptyState
                title="No delivered orders yet"
                description="Completed and cancelled orders will be saved here as a clean history."
              />
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </section>
  );
}
