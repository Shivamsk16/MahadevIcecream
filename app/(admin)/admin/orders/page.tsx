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
      <h1 className="text-2xl font-bold">Orders</h1>

      <section className="flex flex-wrap gap-3">
        <input
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Search order or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-md border px-3 py-2 text-sm"
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

      <section className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
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
