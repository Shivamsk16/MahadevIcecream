import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/products/ProductForm";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order");

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold sm:text-2xl">Add Product</h1>
      <ProductForm categories={categories ?? []} />
    </section>
  );
}
