"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Category } from "@/lib/types";
import { FadeIn } from "@/components/motion/FadeIn";
import { ChevronRight } from "lucide-react";

export default function HomePage() {
  const [name, setName] = useState("Customer");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profile?.full_name) setName(profile.full_name);
      }

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
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
    <section className="space-y-8">
      <FadeIn>
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-heading">
            {name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Order premium ice cream for your store
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Link
          href="/products"
          className="group flex items-center justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white shadow-sm transition-shadow hover:shadow-card dark:border-zinc-800"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Browse catalog
            </p>
            <p className="mt-1 text-lg font-semibold">Shop all products</p>
          </div>
          <ChevronRight className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </FadeIn>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-heading">Categories</h2>
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-surface-secondary/50 p-6 text-sm text-muted">
            No categories loaded. Run{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
              supabase/fix-rls.sql
            </code>{" "}
            in Supabase SQL Editor, then refresh.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat, i) => (
              <FadeIn key={cat.id} delay={0.05 + i * 0.03}>
                <Link
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-card dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-dark-lift"
                >
                  <span className="text-3xl">{cat.icon ?? "🍦"}</span>
                  <span className="mt-3 text-center text-sm font-medium text-heading">
                    {cat.name}
                  </span>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
