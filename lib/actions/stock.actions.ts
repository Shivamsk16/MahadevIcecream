"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function adjustProductStock(
  productId: string,
  action: "add" | "deduct",
  quantity: number,
  note?: string
) {
  if (quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error("Quantity must be a positive integer");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_product_stock", {
    p_product_id: productId,
    p_action: action,
    p_quantity: quantity,
    p_note: note?.trim() || null,
  });

  if (error) {
    if (error.message.includes("NEGATIVE_STOCK")) {
      throw new Error("Cannot deduct more than current stock");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/products");
}
