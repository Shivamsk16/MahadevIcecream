"use server";

import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@/lib/types";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function parseInsufficientStockError(message: string): string | null {
  const match = message.match(/INSUFFICIENT_STOCK:(.+)/);
  if (match) {
    return `Sorry, ${match[1].trim()} is out of stock. Please update your cart.`;
  }
  return null;
}

export async function placeOrder(cartItems: CartItem[], notes?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const stockItems = cartItems.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
  }));

  const { error: stockError } = await supabase.rpc("deduct_stock_on_order", {
    p_items: stockItems,
  });

  if (stockError) {
    const friendly = parseInsufficientStockError(stockError.message);
    throw new Error(friendly ?? stockError.message);
  }

  const total_amount = cartItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const orderNumber = `ORD-${crypto.randomUUID()}`;

const { data: order, error: orderError } = await supabase
  .from("orders")
  .insert({
    order_number: orderNumber,
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
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/inventory");

  return { success: true, order_number: order.order_number };
}

export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "confirmed" | "delivered" | "cancelled"
) {
  const supabase = await createClient();

  if (status === "cancelled") {
    const { data: existing } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (existing?.status !== "cancelled") {
      const { error: restoreError } = await supabase.rpc(
        "restore_stock_on_cancel",
        { p_order_id: orderId }
      );
      if (restoreError) throw new Error(restoreError.message);
    }
  }

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
  revalidatePath("/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/products");
}
