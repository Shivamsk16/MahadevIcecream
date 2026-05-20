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
      <h1 className="text-xl font-bold text-heading dark:text-zinc-100 sm:text-2xl">
        Categories
      </h1>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <article
            key={cat.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-surface p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-dark-card"
          >
            <span className="text-3xl">{cat.icon ?? "🍦"}</span>
            <section>
              <p className="font-medium text-heading dark:text-zinc-100">
                {cat.name}
              </p>
              <p className="text-xs text-muted dark:text-zinc-500">
                Order: {cat.display_order} ·{" "}
                <span
                  className={
                    cat.is_active
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {cat.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            </section>
          </article>
        ))}
      </section>
    </section>
  );
}
