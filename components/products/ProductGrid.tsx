"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  categories,
  initialCategory,
}: {
  products: Product[];
  categories: { id: string; name: string }[];
  initialCategory?: string;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "All");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      if (category === "All") return matchSearch;
      const cat = categories.find((c) => c.name === category);
      const matchCat =
        p.category?.name === category ||
        (cat != null && p.category_id === cat.id);
      return matchSearch && matchCat;
    });
  }, [products, search, category, categories]);

  return (
    <section className="space-y-4">
      <Input
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <section className="flex gap-2 overflow-x-auto pb-2">
        {["All", ...categories.map((c) => c.name)].map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCategory(name)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium",
              category === name
                ? "bg-brand-600 text-white"
                : "bg-white text-gray-600 border"
            )}
          >
            {name}
          </button>
        ))}
      </section>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </section>
      {filtered.length === 0 && (
        <p className="py-12 text-center text-gray-500">No products found</p>
      )}
    </section>
  );
}
