"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardMetrics, Order, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDate";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { updateOrderStatus } from "@/lib/actions/order.actions";
import Link from "next/link";
import { startOfDay, subDays, format } from "date-fns";
import { toast } from "sonner";
import { AdjustStockModal } from "@/components/inventory/AdjustStockModal";
import { getProductStockStatus } from "@/lib/utils/stock";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { MetricCardSkeleton } from "@/components/shared/Skeleton";
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  Truck,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const OrdersBarChart = dynamic(
  () =>
    import("@/components/dashboard/DashboardCharts").then(
      (m) => m.OrdersBarChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const StatusPieChart = dynamic(
  () =>
    import("@/components/dashboard/DashboardCharts").then(
      (m) => m.StatusPieChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl bg-surface-secondary dark:bg-zinc-800/50">
      <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-zinc-700" />
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<{ day: string; orders: number }[]>(
    []
  );
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchInventoryAlerts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .order("stock_quantity", { ascending: true });

    const all = (data as Product[]) ?? [];
    setOutOfStockProducts(
      all.filter((p) => getProductStockStatus(p) === "out_of_stock")
    );
    setLowStockProducts(
      all.filter((p) => getProductStockStatus(p) === "low_stock")
    );
  }

  async function fetchData() {
    const supabase = createClient();
    const today = startOfDay(new Date()).toISOString();

    const { data: todayOrders } = await supabase
      .from("orders")
      .select("*, order_items(*), customer:profiles(full_name)")
      .gte("placed_at", today)
      .order("placed_at", { ascending: false });

    const orders = todayOrders ?? [];
    setRecentOrders(orders.slice(0, 10) as Order[]);

    setMetrics({
      total_orders: orders.length,
      total_order_value: orders.reduce((s, o) => s + Number(o.net_amount), 0),
      pending_orders: orders.filter((o) => o.status === "pending").length,
      pending_order_value: orders
        .filter((o) => o.status === "pending")
        .reduce((s, o) => s + Number(o.net_amount), 0),
      confirmed_orders: orders.filter((o) => o.status === "confirmed").length,
      delivered_orders: orders.filter((o) => o.status === "delivered").length,
    });

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        day: format(d, "EEE"),
        date: format(d, "yyyy-MM-dd"),
        orders: 0,
      };
    });

    const weekStart = subDays(new Date(), 6).toISOString();
    const { data: weekOrders } = await supabase
      .from("orders")
      .select("placed_at")
      .gte("placed_at", weekStart);

    weekOrders?.forEach((o) => {
      const day = format(new Date(o.placed_at), "yyyy-MM-dd");
      const entry = last7.find((l) => l.date === day);
      if (entry) entry.orders += 1;
    });

    setChartData(last7.map(({ day, orders }) => ({ day, orders })));
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    fetchInventoryAlerts();
    const supabase = createClient();
    const ordersChannel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchData()
      )
      .subscribe();
    const productsChannel = supabase
      .channel("dashboard-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => fetchInventoryAlerts()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
    };
  }, []);

  async function handleStatusChange(orderId: string, status: Order["status"]) {
    try {
      await updateOrderStatus(orderId, status);
      toast.success("Status updated");
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  const pieData = metrics
    ? [
        { name: "Pending", value: metrics.pending_orders },
        { name: "Confirmed", value: metrics.confirmed_orders },
        { name: "Delivered", value: metrics.delivered_orders },
      ].filter((d) => d.value > 0)
    : [];

  const todayLabel = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Today's overview · ${todayLabel}`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/orders">View all orders</Link>
        </Button>
      </PageHeader>

      <FadeIn>
        <div className="dashboard-card bg-gradient-to-br from-surface to-primary-soft/30 p-6 dark:from-zinc-900 dark:to-red-950/20 sm:p-8">
          <p className="section-label">Welcome back</p>
          <h2 className="mt-1 text-2xl font-semibold text-heading sm:text-3xl">
            {metrics?.pending_orders
              ? `${metrics.pending_orders} orders need your attention`
              : "All caught up for today"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Revenue today:{" "}
            <span className="font-semibold text-heading">
              {formatCurrency(metrics?.total_order_value ?? 0)}
            </span>
            {metrics?.pending_order_value ? (
              <>
                {" "}
                · Pending value:{" "}
                <span className="font-medium text-warning">
                  {formatCurrency(metrics.pending_order_value)}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </FadeIn>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))
        ) : (
          <>
            <MetricCard
              label="Total Orders"
              value={metrics?.total_orders ?? 0}
              sub="Today"
              icon={ShoppingBag}
              delay={0}
            />
            <MetricCard
              label="Total Value"
              value={formatCurrency(metrics?.total_order_value ?? 0)}
              sub="Today"
              icon={IndianRupee}
              delay={0.05}
            />
            <MetricCard
              label="Pending"
              value={metrics?.pending_orders ?? 0}
              sub="Action needed"
              icon={Clock}
              trend={metrics?.pending_orders ? "up" : "neutral"}
              delay={0.1}
            />
            <MetricCard
              label="Delivered"
              value={metrics?.delivered_orders ?? 0}
              sub="Today"
              icon={Truck}
              trend="up"
              delay={0.15}
            />
          </>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.1} className="dashboard-card p-6">
          <h2 className="card-title">Orders (Last 7 Days)</h2>
          <div className="mt-4">
            <OrdersBarChart data={chartData} />
          </div>
        </FadeIn>
        <FadeIn delay={0.15} className="dashboard-card p-6">
          <h2 className="card-title">Today by Status</h2>
          <div className="mt-4">
            {pieData.length > 0 ? (
              <StatusPieChart data={pieData} />
            ) : (
              <p className="flex h-[240px] items-center justify-center text-sm text-muted">
                No orders today
              </p>
            )}
          </div>
        </FadeIn>
      </section>

      <FadeIn delay={0.2}>
        <div className="table-container">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className="section-title text-base">Recent Orders</h2>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td>
                      {(order.customer as { full_name?: string })?.full_name ??
                        "—"}
                    </td>
                    <td className="font-medium tabular-nums">
                      {formatCurrency(order.net_amount)}
                    </td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="text-muted">
                      {formatDateTime(order.placed_at)}
                    </td>
                    <td>
                      <select
                        className="form-input h-9 min-w-[120px] py-1 text-xs"
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as Order["status"]
                          )
                        }
                        aria-label={`Update status for ${order.order_number}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <p className="p-12 text-center text-sm text-muted">
                No orders today
              </p>
            )}
          </div>
        </div>
      </FadeIn>

      <section className="space-y-4">
        <h2 className="section-title">Inventory Alerts</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <FadeIn delay={0.1} className="alert-card-danger">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4 dark:border-zinc-800">
              <PackageX className="h-4 w-4 text-danger" />
              <h3 className="font-semibold text-heading">Out of Stock</h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-zinc-800">
              {outOfStockProducts.length === 0 ? (
                <p className="p-5 text-sm text-success">
                  All products are in stock
                </p>
              ) : (
                outOfStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-heading">{p.name}</p>
                      <p className="text-xs text-muted">
                        {(p.category as { name?: string })?.name ?? "—"}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setAdjustProduct(p)}>
                      Restock Now
                    </Button>
                  </div>
                ))
              )}
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="alert-card-warning">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4 dark:border-zinc-800">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="font-semibold text-heading">Low Stock</h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-zinc-800">
              {lowStockProducts.length === 0 ? (
                <p className="p-5 text-sm text-success">No low stock alerts</p>
              ) : (
                lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-heading">{p.name}</p>
                      <p className="text-xs text-muted">
                        {(p.category as { name?: string })?.name ?? "—"} ·{" "}
                        {p.stock_quantity} left (threshold:{" "}
                        {p.low_stock_threshold ?? 10})
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAdjustProduct(p)}
                    >
                      Adjust
                    </Button>
                  </div>
                ))
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      <AdjustStockModal
        product={adjustProduct}
        open={!!adjustProduct}
        onOpenChange={(open) => {
          if (!open) setAdjustProduct(null);
        }}
        onSuccess={() => {
          fetchInventoryAlerts();
        }}
      />
    </div>
  );
}
