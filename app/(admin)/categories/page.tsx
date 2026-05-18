"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/lib/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("display_order");
      setCategories(data ?? []);
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

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <article
            key={cat.id}
            className="flex items-center gap-3 rounded-xl border bg-white p-4"
          >
            <span className="text-3xl">{cat.icon ?? "🍦"}</span>
            <section>
              <p className="font-medium">{cat.name}</p>
              <p className="text-xs text-gray-500">
                Order: {cat.display_order} ·{" "}
                {cat.is_active ? "Active" : "Inactive"}
              </p>
            </section>
          </article>
        ))}
      </section>
    </section>
  );
}
