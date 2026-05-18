"use server";

import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function placeOrder(cartItems: CartItem[], notes?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const total_amount = cartItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      status: "pending",
      total_amount,
      discount_amount: 0,
      net_amount: total_amount,
      notes,
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_price: item.product.price,
    quantity: item.quantity,
    line_total: item.product.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/orders");
  revalidatePath("/dashboard");

  return { success: true, order_number: order.order_number };
}

export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "confirmed" | "delivered" | "cancelled"
) {
  const supabase = await createClient();
  const updates: Record<string, string> = { status };
  if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
  if (status === "delivered") updates.delivered_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
