"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDate";
import { updateOrderStatus } from "@/lib/actions/order.actions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, customer:profiles(*), order_items(*)")
      .eq("id", id)
      .single();
    setOrder(data as Order);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateStatus(status: Order["status"]) {
    try {
      await updateOrderStatus(id, status);
      toast.success("Status updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading) {
    return (
      <section className="flex justify-center py-16">
        <LoadingSpinner />
      </section>
    );
  }

  if (!order) {
    return <p>Order not found</p>;
  }

  const customer = order.customer as {
    full_name?: string;
    phone?: string;
  };

  return (
    <section className="space-y-6">
      <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">
        ← Back to Orders
      </Link>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <section>
          <h1 className="text-xl font-bold sm:text-2xl">{order.order_number}</h1>
          <OrderStatusBadge status={order.status} />
        </section>
        <select
          className="w-full rounded-md border px-3 py-2 sm:w-auto"
          value={order.status}
          onChange={(e) => updateStatus(e.target.value as Order["status"])}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </section>

      <section className="rounded-xl border bg-white p-4 text-sm">
        <p>
          <strong>Customer:</strong> {customer?.full_name ?? "—"}
        </p>
        <p>
          <strong>Phone:</strong> {customer?.phone ?? "—"}
        </p>
        <p>
          <strong>Placed:</strong> {formatDateTime(order.placed_at)}
        </p>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Product</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Price</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items?.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.product_name}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{formatCurrency(item.product_price)}</td>
                <td className="p-3">{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="p-3 text-right font-semibold">
                TOTAL
              </td>
              <td className="p-3 font-bold text-brand-700">
                {formatCurrency(order.net_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </section>
  );
}
