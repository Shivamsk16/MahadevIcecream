"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardMetrics, Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDate";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { updateOrderStatus } from "@/lib/actions/order.actions";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { startOfDay, subDays, format } from "date-fns";
import { toast } from "sonner";

const COLORS = ["#E53935", "#FF9800", "#4CAF50", "#2196F3", "#9C27B0"];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<{ day: string; orders: number }[]>([]);

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
      return { day: format(d, "EEE"), date: format(d, "yyyy-MM-dd"), orders: 0 };
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
  }

  useEffect(() => {
    fetchData();
    const supabase = createClient();
    const channel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
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

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Sales Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Orders", value: metrics?.total_orders ?? 0, sub: "Today" },
          {
            label: "Total Value",
            value: formatCurrency(metrics?.total_order_value ?? 0),
            sub: "Today",
          },
          {
            label: "Pending Orders",
            value: metrics?.pending_orders ?? 0,
            sub: "Action needed",
          },
          {
            label: "Delivered",
            value: metrics?.delivered_orders ?? 0,
            sub: "Today",
          },
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400">{card.sub}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-semibold">Orders (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#E53935" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 font-semibold">Today by Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-gray-400">No orders today</p>
          )}
        </article>
      </section>

      <article className="rounded-xl border bg-white">
        <h2 className="border-b p-4 font-semibold">Recent Orders</h2>
        <section className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Time</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="p-3">
                    {(order.customer as { full_name?: string })?.full_name ?? "—"}
                  </td>
                  <td className="p-3">{formatCurrency(order.net_amount)}</td>
                  <td className="p-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="p-3">{formatDateTime(order.placed_at)}</td>
                  <td className="p-3">
                    <select
                      className="rounded border px-2 py-1 text-xs"
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(
                          order.id,
                          e.target.value as Order["status"]
                        )
                      }
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
            <p className="p-8 text-center text-gray-400">No orders today</p>
          )}
        </section>
      </article>
    </section>
  );
}
