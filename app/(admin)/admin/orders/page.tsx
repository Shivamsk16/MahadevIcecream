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
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
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
    <section className="space-y-8">
      <PageHeader title="Orders" description="Manage and update order status" />

      <section className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search order or customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <select
          className="form-input h-11 w-full sm:w-auto"
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
          <article key={order.id} className="dashboard-card p-4">
            <section className="flex items-start justify-between gap-2">
              <Link
                href={`/admin/orders/${order.id}`}
                className="font-medium text-primary"
              >
                {order.order_number}
              </Link>
              <OrderStatusBadge status={order.status} />
            </section>
            <p className="mt-1 text-sm text-muted">
              {(order.customer as { full_name?: string })?.full_name ?? "—"}
            </p>
            <p className="text-xs text-muted">
              {formatDateTime(order.placed_at)} · {formatCurrency(order.net_amount)}
            </p>
            <select
              className="form-input mt-3 h-10 text-sm"
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

      <div className="table-container hidden md:block">
        <div className="overflow-x-auto">
        <table className="data-table min-w-[640px]">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
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
                  {(order.customer as { full_name?: string })?.full_name ?? "—"}
                </td>
                <td>{formatDateTime(order.placed_at)}</td>
                <td className="font-medium tabular-nums">{formatCurrency(order.net_amount)}</td>
                <td>
                  <OrderStatusBadge status={order.status} />
                </td>
                <td>
                  <select
                    className="form-input h-9 min-w-[120px] py-1 text-xs"
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
        </div>
      </div>
    </section>
  );
}
