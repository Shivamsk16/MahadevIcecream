"use client";

import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";
import { normalizeOrder } from "@/lib/utils/order";

const ORDER_SELECT =
  "id, order_number, customer_id, status, total_amount, discount_amount, net_amount, notes, placed_at, confirmed_at, delivered_at, customer:profiles(full_name)";

/** Client-side order fetch for dashboard date filtering (no server action changes). */
export async function fetchDashboardOrders(): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("placed_at", { ascending: false });

  if (error) {
    console.error("[Dashboard] fetchDashboardOrders:", error);
    return [];
  }

  return (data ?? []).map((row) =>
    normalizeOrder(row as Record<string, unknown>)
  ) as unknown as Order[];
}
