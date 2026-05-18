"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  toggleProductAvailability,
  deleteProduct,
} from "@/lib/actions/product.actions";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .order("name");
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id: string, available: boolean) {
    try {
      await toggleProductAvailability(id, available);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_available: available } : p
        )
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading) {
    return (
      <section className="flex justify-center py-16">
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Products</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </section>

      {/* Mobile cards */}
      <section className="space-y-3 md:hidden">
        {products.map((p) => (
          <article
            key={p.id}
            className="flex gap-3 rounded-xl border bg-white p-3 shadow-sm"
          >
            <section className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {p.image_url ? (
                <Image src={p.image_url} alt="" fill className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-2xl">
                  🍦
                </span>
              )}
            </section>
            <section className="min-w-0 flex-1">
              <p className="font-medium leading-tight">{p.name}</p>
              <p className="text-xs text-gray-500">
                {(p.category as { name?: string })?.name ?? "—"} ·{" "}
                {formatCurrency(p.price)}
              </p>
              <section className="mt-2 flex items-center justify-between">
                <Switch
                  checked={p.is_available}
                  onCheckedChange={(v) => toggle(p.id, v)}
                />
                <section className="flex gap-1">
                  <Button size="icon" variant="outline" asChild>
                    <Link href={`/admin/products/${p.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </section>
              </section>
            </section>
          </article>
        ))}
      </section>

      <section className="hidden overflow-x-auto rounded-xl border bg-white md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Available</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">
                  <section className="relative h-10 w-10 overflow-hidden rounded bg-gray-100">
                    {p.image_url ? (
                      <Image src={p.image_url} alt="" fill className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center">🍦</span>
                    )}
                  </section>
                </td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">
                  {(p.category as { name?: string })?.name ?? "—"}
                </td>
                <td className="p-3">{formatCurrency(p.price)}</td>
                <td className="p-3">{p.discount_percent}%</td>
                <td className="p-3">
                  <Switch
                    checked={p.is_available}
                    onCheckedChange={(v) => toggle(p.id, v)}
                  />
                </td>
                <td className="p-3">
                  <section className="flex gap-2">
                    <Button size="icon" variant="outline" asChild>
                      <Link href={`/admin/products/${p.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </section>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
