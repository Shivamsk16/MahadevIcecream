"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleProductAvailability(
  productId: string,
  isAvailable: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function saveProduct(
  data: Record<string, unknown>,
  productId?: string
) {
  const supabase = await createClient();

  if (productId) {
    const { error } = await supabase
      .from("products")
      .update(data)
      .eq("id", productId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("products").insert(data);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
