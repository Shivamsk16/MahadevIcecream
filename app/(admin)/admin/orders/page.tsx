"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderStatus } from "@/lib/types";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDate";
import { updateOrderStatus } from "@/lib/actions/order.actions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  async function load() {
    const supabase = createClient();
    let query = supabase
      .from("orders")
      .select("*, customer:profiles(full_name, phone)")
      .order("placed_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [statusFilter]);

  async function handleStatus(orderId: string, status: OrderStatus) {
    try {
      await updateOrderStatus(orderId, status);
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (o.customer as { full_name?: string })?.full_name?.toLowerCase() ?? "";
    return o.order_number.toLowerCase().includes(q) || name.includes(q);
  });

  if (loading) {
    return (
      <section className="flex justify-center py-16">
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold sm:text-2xl">Orders</h1>

      <section className="flex flex-col gap-3 sm:flex-row">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Search order or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </section>

      <section className="space-y-3 md:hidden">
        {filtered.map((order) => (
          <article key={order.id} className="rounded-xl border bg-white p-4">
            <section className="flex items-start justify-between gap-2">
              <Link
                href={`/admin/orders/${order.id}`}
                className="font-medium text-brand-600"
              >
                {order.order_number}
              </Link>
              <OrderStatusBadge status={order.status} />
            </section>
            <p className="mt-1 text-sm text-gray-600">
              {(order.customer as { full_name?: string })?.full_name ?? "—"}
            </p>
            <p className="text-xs text-gray-500">
              {formatDateTime(order.placed_at)} · {formatCurrency(order.net_amount)}
            </p>
            <select
              className="mt-3 w-full rounded-md border px-3 py-2 text-sm"
              value={order.status}
              onChange={(e) =>
                handleStatus(order.id, e.target.value as OrderStatus)
              }
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </article>
        ))}
      </section>

      <section className="hidden overflow-x-auto rounded-xl border bg-white md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Date</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b">
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
                <td className="p-3">{formatDateTime(order.placed_at)}</td>
                <td className="p-3">{formatCurrency(order.net_amount)}</td>
                <td className="p-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="p-3">
                  <select
                    className="rounded border px-2 py-1 text-xs"
                    value={order.status}
                    onChange={(e) =>
                      handleStatus(order.id, e.target.value as OrderStatus)
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
      </section>
    </section>
  );
}
