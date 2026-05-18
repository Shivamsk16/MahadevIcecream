"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

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
      <div className="sticky top-[57px] z-20 -mx-1 space-y-3 rounded-2xl border border-neutral-200/80 bg-surface/95 p-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["All", ...categories.map((c) => c.name)].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                category === name
                  ? "bg-primary text-white shadow-sm"
                  : "border border-neutral-200 bg-surface text-muted hover:border-neutral-300 hover:text-heading"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-neutral-200 py-12 text-center text-sm text-muted">
          No products found
        </p>
      )}
    </section>
  );
}
