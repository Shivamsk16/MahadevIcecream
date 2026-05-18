"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

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

  if (loading) {
    return (
      <section className="flex justify-center py-16">
        <LoadingSpinner />
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Place your first order from the products page"
        actionLabel="Browse Products"
        actionHref="/products"
      />
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">My Orders</h1>
      {orders.map((order) => (
        <article
          key={order.id}
          className="rounded-xl border bg-white p-4"
        >
          <button
            type="button"
            className="w-full text-left"
            onClick={() =>
              setExpanded(expanded === order.id ? null : order.id)
            }
          >
            <section className="flex items-start justify-between">
              <section>
                <p className="font-medium">{order.order_number}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(order.placed_at)} · {order.order_items?.length ?? 0} items
                </p>
              </section>
              <section className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} />
                {expanded === order.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </section>
            </section>
            <p className="mt-2 font-semibold text-brand-700">
              {formatCurrency(order.net_amount)}
            </p>
          </button>
          {expanded === order.id && order.order_items && (
            <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.product_name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.line_total)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  );
}
