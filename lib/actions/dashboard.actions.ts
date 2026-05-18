"use server";

import { createClient } from "@/lib/supabase/server";
import { DashboardMetrics, Order, Product } from "@/lib/types";
import { getProductStockStatus } from "@/lib/utils/stock";
import { normalizeOrder } from "@/lib/utils/order";
import { endOfDay, format, startOfDay, subDays } from "date-fns";

const EMPTY_METRICS: DashboardMetrics = {
  total_orders: 0,
  total_order_value: 0,
  pending_orders: 0,
  pending_order_value: 0,
  confirmed_orders: 0,
  delivered_orders: 0,
};

const ORDER_SELECT =
  "id, order_number, customer_id, status, total_amount, discount_amount, net_amount, notes, placed_at, confirmed_at, delivered_at, customer:profiles!customer_id(full_name)";

const ORDER_SELECT_FALLBACK =
  "id, order_number, customer_id, status, total_amount, discount_amount, net_amount, notes, placed_at, confirmed_at, delivered_at, customer:profiles(full_name)";

function logError(context: string, error: unknown) {
  console.error(`[Dashboard] ${context}:`, error);
}

/** date-fns local day bounds as ISO strings for placed_at filters. */
function getPlacedAtDayRange(referenceDate: Date = new Date()) {
  const start = startOfDay(referenceDate);
  const end = endOfDay(referenceDate);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function computeMetricsFromOrders(
  orders: { status: string; net_amount: unknown }[] | null | undefined
): DashboardMetrics {
  const list = orders ?? [];
  return {
    total_orders: list.length ?? 0,
    total_order_value:
      list.reduce((sum, order) => sum + Number(order.net_amount || 0), 0) ?? 0,
    pending_orders:
      list.filter((o) => o.status === "pending").length ?? 0,
    pending_order_value:
      list
        .filter((o) => o.status === "pending")
        .reduce((sum, o) => sum + Number(o.net_amount || 0), 0) ?? 0,
    confirmed_orders:
      list.filter((o) => o.status === "confirmed").length ?? 0,
    delivered_orders:
      list.filter((o) => o.status === "delivered").length ?? 0,
  };
}

/**
 * Dashboard summary cards — all orders (no date filter).
 * Server actions run in UTC; filtering "today" via ISO broke IST metrics.
 * Charts still use last-7-days; this matches the Admin Orders list totals.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logError("getDashboardMetrics auth", authError ?? "No user");
      return EMPTY_METRICS;
    }

    const { data: orders, error } = await supabase.from("orders").select("*");

    if (error) {
      console.error("Dashboard metrics error:", error);
      logError("getDashboardMetrics query", error);
      return EMPTY_METRICS;
    }

    console.log(
      "[Dashboard] orders:",
      (orders ?? []).map((o) => ({
        id: o.id,
        placed_at: o.placed_at,
        status: o.status,
      }))
    );

    const metrics = computeMetricsFromOrders(orders);
    console.log("[Dashboard] metrics:", metrics);
    return metrics;
  } catch (err) {
    logError("getDashboardMetrics", err);
    return EMPTY_METRICS;
  }
}

/** Optional: today's orders only (date-fns start/end of local day). */
export async function getTodayDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const supabase = await createClient();
    const { startIso, endIso } = getPlacedAtDayRange();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .gte("placed_at", startIso)
      .lte("placed_at", endIso);

    if (error) {
      console.error("Dashboard metrics error:", error);
      return EMPTY_METRICS;
    }

    return computeMetricsFromOrders(orders);
  } catch (err) {
    logError("getTodayDashboardMetrics", err);
    return EMPTY_METRICS;
  }
}

export async function getSalesChartData(): Promise<
  { day: string; orders: number }[]
> {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      day: format(d, "EEE"),
      date: format(d, "yyyy-MM-dd"),
      orders: 0,
    };
  });

  try {
    const supabase = await createClient();
    const weekStart = startOfDay(subDays(new Date(), 6));

    const { data, error } = await supabase
      .from("orders")
      .select("placed_at")
      .gte("placed_at", weekStart.toISOString());

    if (error) {
      logError("getSalesChartData", error);
      return last7.map(({ day, orders }) => ({ day, orders }));
    }

    (data ?? []).forEach((row) => {
      if (!row.placed_at) return;
      const dayKey = format(new Date(row.placed_at), "yyyy-MM-dd");
      const entry = last7.find((l) => l.date === dayKey);
      if (entry) entry.orders += 1;
    });

    const chartData = last7.map(({ day, orders }) => ({ day, orders }));
    console.log("[Dashboard] chartData:", chartData);
    return chartData;
  } catch (err) {
    logError("getSalesChartData", err);
    return last7.map(({ day, orders }) => ({ day, orders }));
  }
}

export async function getOrderStatusData(): Promise<
  { name: string; value: number }[]
> {
  const metrics = await getDashboardMetrics();
  return [
    { name: "Pending", value: metrics.pending_orders },
    { name: "Confirmed", value: metrics.confirmed_orders },
    { name: "Delivered", value: metrics.delivered_orders },
  ].filter((d) => d.value > 0);
}

export async function getRecentOrders(limit = 10): Promise<Order[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .order("placed_at", { ascending: false })
      .limit(limit);

    if (error) {
      logError("getRecentOrders", error);
      const fallback = await supabase
        .from("orders")
        .select(ORDER_SELECT_FALLBACK)
        .order("placed_at", { ascending: false })
        .limit(limit);

      if (fallback.error) {
        logError("getRecentOrders fallback", fallback.error);
        return [];
      }

      const rows = (fallback.data ?? []).map((row) =>
        normalizeOrder(row as Record<string, unknown>)
      );
      console.log("[Dashboard] recentOrders (fallback):", rows.length);
      return rows as unknown as Order[];
    }

    const rows = (data ?? []).map((row) =>
      normalizeOrder(row as Record<string, unknown>)
    );
    console.log("[Dashboard] recentOrders:", rows.length);
    return rows as unknown as Order[];
  } catch (err) {
    logError("getRecentOrders", err);
    return [];
  }
}

export async function getInventoryAlerts(): Promise<{
  outOfStock: Product[];
  lowStock: Product[];
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .order("stock_quantity", { ascending: true });

    if (error) {
      logError("getInventoryAlerts", error);
      return { outOfStock: [], lowStock: [] };
    }

    const all = (data as Product[]) ?? [];
    const outOfStock = all.filter(
      (p) => getProductStockStatus(p) === "out_of_stock"
    );
    const lowStock = all.filter((p) => getProductStockStatus(p) === "low_stock");
    console.log("[Dashboard] inventory alerts:", {
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
    });
    return { outOfStock, lowStock };
  } catch (err) {
    logError("getInventoryAlerts", err);
    return { outOfStock: [], lowStock: [] };
  }
}

export type DashboardPayload = {
  metrics: DashboardMetrics;
  chartData: { day: string; orders: number }[];
  recentOrders: Order[];
  outOfStockProducts: Product[];
  lowStockProducts: Product[];
  errors: string[];
};

export async function loadDashboardData(): Promise<DashboardPayload> {
  const errors: string[] = [];

  let metrics = EMPTY_METRICS;
  try {
    metrics = await getDashboardMetrics();
  } catch (e) {
    errors.push("Failed to load metrics");
    logError("loadDashboardData metrics", e);
  }

  let chartData: { day: string; orders: number }[] = [];
  try {
    chartData = await getSalesChartData();
  } catch (e) {
    errors.push("Failed to load chart data");
    logError("loadDashboardData chart", e);
    chartData = Array.from({ length: 7 }, (_, i) => ({
      day: format(subDays(new Date(), 6 - i), "EEE"),
      orders: 0,
    }));
  }

  let recentOrders: Order[] = [];
  try {
    recentOrders = await getRecentOrders();
  } catch (e) {
    errors.push("Failed to load recent orders");
    logError("loadDashboardData orders", e);
  }

  let outOfStockProducts: Product[] = [];
  let lowStockProducts: Product[] = [];
  try {
    const inventory = await getInventoryAlerts();
    outOfStockProducts = inventory.outOfStock;
    lowStockProducts = inventory.lowStock;
  } catch (e) {
    errors.push("Failed to load inventory alerts");
    logError("loadDashboardData inventory", e);
  }

  if (errors.length > 0) {
    console.error("[Dashboard] loadDashboardData errors:", errors);
  }

  return {
    metrics,
    chartData,
    recentOrders,
    outOfStockProducts,
    lowStockProducts,
    errors,
  };
}
