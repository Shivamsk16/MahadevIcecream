"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Category } from "@/lib/types";

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
    <section className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold text-gray-900">
          Welcome, {name}!
        </h1>
        <p className="text-sm text-gray-500">
          Order premium ice cream for your store
        </p>
      </section>

      <section className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-brand-700 to-brand-500">
        <p className="font-display text-2xl font-bold text-white">
          Premium Ice Cream
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-gray-800">Categories</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">
            No categories loaded. Run <code>supabase/fix-rls.sql</code> in Supabase
            SQL Editor, then refresh.
          </p>
        ) : (
          <section className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
              >
                <Card className="transition hover:border-brand-200 hover:shadow-md">
                  <CardContent className="flex flex-col items-center p-4">
                    <span className="text-3xl">{cat.icon ?? "🍦"}</span>
                    <span className="mt-2 font-medium text-gray-800">
                      {cat.name}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>
        )}
      </section>
    </section>
  );
}
