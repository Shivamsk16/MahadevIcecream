"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/lib/types";
import { ProductGrid } from "./ProductGrid";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

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
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Could not load products</p>
        <p className="mt-1">{error}</p>
        <p className="mt-2 text-xs text-red-600">
          Run the full script in{" "}
          <code className="rounded bg-red-100 px-1">supabase/fix-rls.sql</code>{" "}
          in Supabase SQL Editor, then refresh this page.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">Products</h1>
      <ProductGrid
        products={products}
        categories={categories}
        initialCategory={initialCategory}
      />
    </section>
  );
}
