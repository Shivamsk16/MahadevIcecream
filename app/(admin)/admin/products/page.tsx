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
import { Pencil, Trash2, Plus, PackagePlus, LayoutGrid, List } from "lucide-react";
import {
  StockQuantityBadge,
  StockStatusBadge,
} from "@/components/inventory/StockStatusBadge";
import { AdjustStockModal } from "@/components/inventory/AdjustStockModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { FadeIn } from "@/components/motion/FadeIn";
import { cn } from "@/lib/utils";
import { getProductStockStatus } from "@/lib/utils/stock";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [view, setView] = useState<"table" | "cards">("table");

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
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Products" description="Manage catalog, pricing, and availability">
        <div className="flex items-center gap-2">
          <div className="hidden rounded-xl border border-neutral-200 p-1 sm:flex">
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "rounded-lg p-2 transition-colors",
                view === "table" ? "bg-primary-soft text-primary" : "text-muted"
              )}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              className={cn(
                "rounded-lg p-2 transition-colors",
                view === "cards" ? "bg-primary-soft text-primary" : "text-muted"
              )}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Mobile cards */}
      <section className="space-y-3 md:hidden">
        {products.map((p, i) => (
          <FadeIn key={p.id} delay={i * 0.03}>
            <ProductAdminCard
              product={p}
              onToggle={toggle}
              onRemove={remove}
              onAdjust={() => setAdjustProduct(p)}
            />
          </FadeIn>
        ))}
      </section>

      {view === "cards" && (
        <section className="hidden gap-4 sm:grid-cols-2 lg:grid-cols-3 md:grid">
          {products.map((p, i) => (
            <FadeIn key={p.id} delay={i * 0.03}>
              <ProductAdminCard
                product={p}
                onToggle={toggle}
                onRemove={remove}
                onAdjust={() => setAdjustProduct(p)}
                large
              />
            </FadeIn>
          ))}
        </section>
      )}

      {view === "table" && (
        <div className="table-container hidden md:block">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <ProductThumb product={p} />
                    </td>
                    <td className="font-medium text-heading">{p.name}</td>
                    <td className="text-muted">
                      {(p.category as { name?: string })?.name ?? "—"}
                    </td>
                    <td className="tabular-nums">{formatCurrency(p.price)}</td>
                    <td className="tabular-nums">{p.discount_percent}%</td>
                    <td>
                      <StockQuantityBadge product={p} />
                    </td>
                    <td>
                      <StockStatusBadge product={p} />
                    </td>
                    <td>
                      <Switch
                        checked={p.is_available}
                        onCheckedChange={(v) => toggle(p.id, v)}
                      />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          title="Adjust stock"
                          onClick={() => setAdjustProduct(p)}
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
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
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdjustStockModal
        product={adjustProduct}
        open={!!adjustProduct}
        onOpenChange={(open) => !open && setAdjustProduct(null)}
        onSuccess={load}
      />
    </div>
  );
}

function ProductThumb({ product }: { product: Product }) {
  const isOut = getProductStockStatus(product) === "out_of_stock";
  return (
    <div
      className={cn(
        "relative h-11 w-11 overflow-hidden rounded-lg bg-surface-secondary",
        isOut && "opacity-60 grayscale"
      )}
    >
      {product.image_url ? (
        <Image src={product.image_url} alt="" fill className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center">🍦</span>
      )}
    </div>
  );
}

function ProductAdminCard({
  product: p,
  onToggle,
  onRemove,
  onAdjust,
  large,
}: {
  product: Product;
  onToggle: (id: string, v: boolean) => void;
  onRemove: (id: string) => void;
  onAdjust: () => void;
  large?: boolean;
}) {
  const isOut = getProductStockStatus(p) === "out_of_stock";

  return (
    <article
      className={cn(
        "flex gap-4 rounded-2xl border border-neutral-200 bg-surface p-4 shadow-sm transition-shadow hover:shadow-card",
        isOut && "opacity-90"
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl bg-surface-secondary",
          large ? "h-24 w-24" : "h-16 w-16",
          isOut && "grayscale"
        )}
      >
        {p.image_url ? (
          <Image src={p.image_url} alt="" fill className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-2xl">🍦</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-heading">{p.name}</p>
        <p className="text-xs text-muted">
          {(p.category as { name?: string })?.name ?? "—"} ·{" "}
          {formatCurrency(p.price)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StockQuantityBadge product={p} />
          <StockStatusBadge product={p} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Switch
            checked={p.is_available}
            onCheckedChange={(v) => onToggle(p.id, v)}
          />
          <div className="flex gap-1">
            <Button size="icon" variant="outline" onClick={onAdjust}>
              <PackagePlus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" asChild>
              <Link href={`/admin/products/${p.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="icon" variant="outline" onClick={() => onRemove(p.id)}>
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
