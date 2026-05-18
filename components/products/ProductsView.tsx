"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/lib/types";
import { ProductGrid } from "./ProductGrid";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { FadeIn } from "@/components/motion/FadeIn";

export function ProductsView({
  initialCategory,
}: {
  initialCategory?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order");

      if (catError) {
        setError(catError.message);
        setLoading(false);
        return;
      }

      const { data: prodData, error: prodError } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("name");

      if (prodError) {
        setError(prodError.message);
        setLoading(false);
        return;
      }

      setCategories(catData ?? []);
      setProducts((prodData as Product[]) ?? []);
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

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-danger-soft p-4 text-sm text-danger">
        <p className="font-semibold">Could not load products</p>
        <p className="mt-1">{error}</p>
        <p className="mt-2 text-xs opacity-80">
          Run the full script in{" "}
          <code className="rounded bg-red-100/80 px-1">supabase/fix-rls.sql</code>{" "}
          in Supabase SQL Editor, then refresh.
        </p>
      </section>
    );
  }

  return (
    <FadeIn className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-heading">
          Products
        </h1>
        <p className="mt-1 text-sm text-muted">
          {products.length} items available
        </p>
      </div>
      <ProductGrid
        products={products}
        categories={categories}
        initialCategory={initialCategory}
      />
    </FadeIn>
  );
}
