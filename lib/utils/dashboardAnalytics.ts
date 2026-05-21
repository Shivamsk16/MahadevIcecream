import type { DashboardMetrics, Order } from "@/lib/types";
import {
  eachDayOfInterval,
  endOfDay,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

export type DashboardDateFilterMode = "all" | "today" | "custom" | "range";

export function getTodayDateInputValue(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateInput(value: string): Date {
  return startOfDay(parseISO(value));
}

export function clampDateInputToToday(value: string): string {
  const today = getTodayDateInputValue();
  if (!value || value > today) return today;
  return value;
}

export function computeMetricsFromOrders(
  orders: Pick<Order, "status" | "net_amount">[]
): DashboardMetrics {
  return {
    total_orders: orders.length,
    total_order_value: orders.reduce(
      (sum, order) => sum + Number(order.net_amount || 0),
      0
    ),
    pending_orders: orders.filter((o) => o.status === "pending").length,
    pending_order_value: orders
      .filter((o) => o.status === "pending")
      .reduce((sum, o) => sum + Number(o.net_amount || 0), 0),
    confirmed_orders: orders.filter((o) => o.status === "confirmed").length,
    delivered_orders: orders.filter((o) => o.status === "delivered").length,
  };
}

export function getFilterBounds(
  mode: Exclude<DashboardDateFilterMode, "all">,
  customDate: string,
  rangeFrom: string,
  rangeTo: string
): { start: Date; end: Date } {
  const todayStart = startOfDay(new Date());

  if (mode === "today") {
    return { start: todayStart, end: endOfDay(new Date()) };
  }

  if (mode === "custom") {
    const d = parseDateInput(customDate);
    return { start: startOfDay(d), end: endOfDay(d) };
  }

  const from = parseDateInput(rangeFrom);
  const to = parseDateInput(rangeTo);
  return { start: startOfDay(from), end: endOfDay(to) };
}

export function filterOrdersForDashboard(
  orders: Order[],
  mode: DashboardDateFilterMode,
  customDate: string,
  rangeFrom: string,
  rangeTo: string
): Order[] {
  if (mode === "all") return orders;
  const bounds = getFilterBounds(mode, customDate, rangeFrom, rangeTo);
  return filterOrdersByPeriod(orders, bounds);
}

/** Last 7 days activity chart for the All Orders overview. */
export function buildLast7DaysChartData(
  orders: Order[]
): { day: string; orders: number }[] {
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      day: format(d, "EEE"),
      date: format(d, "yyyy-MM-dd"),
      orders: 0,
    };
  });

  orders.forEach((order) => {
    if (!order.placed_at) return;
    const dayKey = format(new Date(order.placed_at), "yyyy-MM-dd");
    const entry = buckets.find((b) => b.date === dayKey);
    if (entry) entry.orders += 1;
  });

  return buckets.map(({ day, orders: count }) => ({ day, orders: count }));
}

export function buildDashboardChartData(
  allOrders: Order[],
  filteredOrders: Order[],
  mode: DashboardDateFilterMode,
  customDate: string,
  rangeFrom: string,
  rangeTo: string
): { day: string; orders: number }[] {
  if (mode === "all") return buildLast7DaysChartData(allOrders);
  const bounds = getFilterBounds(mode, customDate, rangeFrom, rangeTo);
  return buildOrdersChartData(filteredOrders, bounds);
}

export function filterOrdersByPeriod(
  orders: Order[],
  bounds: { start: Date; end: Date }
): Order[] {
  return orders.filter((order) => {
    if (!order.placed_at) return false;
    const placed = new Date(order.placed_at);
    return !isBefore(placed, bounds.start) && !isAfter(placed, bounds.end);
  });
}

export function buildOrdersChartData(
  orders: Order[],
  bounds: { start: Date; end: Date }
): { day: string; orders: number }[] {
  const days = eachDayOfInterval({ start: bounds.start, end: bounds.end });
  return days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const count = orders.filter((order) => {
      if (!order.placed_at) return false;
      const placed = new Date(order.placed_at);
      return !isBefore(placed, dayStart) && !isAfter(placed, dayEnd);
    }).length;
    return {
      day: format(day, days.length <= 7 ? "EEE" : "d MMM"),
      orders: count,
    };
  });
}

function formatPeriodDate(date: Date): string {
  return format(date, "d MMM yyyy");
}

export function getChartSectionTitle(
  mode: DashboardDateFilterMode,
  customDate: string,
  rangeFrom: string,
  rangeTo: string
): string {
  if (mode === "all") return "Orders · All Time";
  if (mode === "today") return "Orders · Today";
  if (mode === "custom") {
    return `Orders · ${formatPeriodDate(parseDateInput(customDate))}`;
  }
  const from = parseDateInput(rangeFrom);
  const to = parseDateInput(rangeTo);
  if (format(from, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")) {
    return `Orders · ${formatPeriodDate(from)}`;
  }
  return `Orders · ${formatPeriodDate(from)} → ${formatPeriodDate(to)}`;
}

export function formatDashboardPeriodLabel(
  mode: DashboardDateFilterMode,
  customDate: string,
  rangeFrom: string,
  rangeTo: string
): string {
  if (mode === "all") return "Overall Business Overview";
  if (mode === "today") return "Today's Orders Overview";
  if (mode === "custom") {
    return `Orders · ${formatPeriodDate(parseDateInput(customDate))}`;
  }
  const from = parseDateInput(rangeFrom);
  const to = parseDateInput(rangeTo);
  if (format(from, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")) {
    return `Orders · ${formatPeriodDate(from)}`;
  }
  return `Orders · ${formatPeriodDate(from)} → ${formatPeriodDate(to)}`;
}

export function getWelcomeRevenueLabel(mode: DashboardDateFilterMode): string {
  return mode === "all" ? "Overall Revenue" : "Total revenue";
}

export function getWelcomePendingValueLabel(
  mode: DashboardDateFilterMode
): string {
  return mode === "all" ? "Overall pending value" : "Pending value";
}

export function getRecentOrdersForPeriod(
  orders: Order[],
  limit = 10
): Order[] {
  return [...orders]
    .sort(
      (a, b) =>
        new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
    )
    .slice(0, limit);
}
