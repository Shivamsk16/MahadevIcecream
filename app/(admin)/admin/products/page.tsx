"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Category, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  toggleProductAvailability,
  deleteProduct,
} from "@/lib/actions/product.actions";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Plus,
  PackagePlus,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  StockQuantityBadge,
  StockStatusBadge,
} from "@/components/inventory/StockStatusBadge";
import { AdjustStockModal } from "@/components/inventory/AdjustStockModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { FadeIn } from "@/components/motion/FadeIn";
import { cn } from "@/lib/utils";
import { getProductStockStatus } from "@/lib/utils/stock";

type DemandSort = "default" | "high_to_low" | "low_to_high";
type AvailabilityFilter = "all" | "available" | "hidden";

function getCategoryName(p: Product) {
  return (p.category as { name?: string })?.name ?? "";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [demandSort, setDemandSort] = useState<DemandSort>("default");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");

  async function load() {
    const supabase = createClient();
    const [{ data }, { data: cats }] = await Promise.all([
      supabase
        .from("products")
        .select("*, category:categories(name)")
        .order("name"),
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order"),
    ]);
    setProducts((data as Product[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    setLoading(false);
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    demandSort !== "default" ||
    availabilityFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setDemandSort("default");
    setAvailabilityFilter("all");
  }

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q);
      const catName = getCategoryName(p);
      const matchesCategory =
        categoryFilter === "all" || catName === categoryFilter;
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && p.is_available) ||
        (availabilityFilter === "hidden" && !p.is_available);
      return matchesSearch && matchesCategory && matchesAvailability;
    });

    if (demandSort === "high_to_low") {
      list = [...list].sort((a, b) => a.stock_quantity - b.stock_quantity);
    } else if (demandSort === "low_to_high") {
      list = [...list].sort((a, b) => b.stock_quantity - a.stock_quantity);
    }

    return list;
  }, [products, search, categoryFilter, demandSort, availabilityFilter]);

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

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative flex-1 lg:min-w-[200px] lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="form-input h-11 w-full lg:w-auto lg:min-w-[160px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="form-input h-11 w-full lg:w-auto lg:min-w-[160px]"
          value={demandSort}
          onChange={(e) => setDemandSort(e.target.value as DemandSort)}
          aria-label="Sort by demand"
        >
          <option value="default">Sort by Demand</option>
          <option value="high_to_low">High to Low Demand</option>
          <option value="low_to_high">Low to High Demand</option>
        </select>
        <select
          className="form-input h-11 w-full lg:w-auto lg:min-w-[160px]"
          value={availabilityFilter}
          onChange={(e) =>
            setAvailabilityFilter(e.target.value as AvailabilityFilter)
          }
          aria-label="Filter by availability"
        >
          <option value="all">All Products</option>
          <option value="available">Available Only</option>
          <option value="hidden">Hidden Only</option>
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Mobile cards */}
      <section className="space-y-3 md:hidden">
        {filteredProducts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-muted">
            No products match your filters.{" "}
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-primary hover:underline"
            >
              Clear Filters
            </button>
          </p>
        ) : (
          filteredProducts.map((p, i) => (
            <FadeIn key={p.id} delay={i * 0.03}>
              <ProductAdminCard
                product={p}
                onToggle={toggle}
                onRemove={remove}
                onAdjust={() => setAdjustProduct(p)}
              />
            </FadeIn>
          ))
        )}
      </section>

      {view === "cards" && (
        <section className="hidden gap-4 sm:grid-cols-2 lg:grid-cols-3 md:grid">
          {filteredProducts.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-muted">
              No products match your filters.{" "}
              <button
                type="button"
                onClick={clearFilters}
                className="font-medium text-primary hover:underline"
              >
                Clear Filters
              </button>
            </p>
          ) : (
            filteredProducts.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.03}>
                <ProductAdminCard
                  product={p}
                  onToggle={toggle}
                  onRemove={remove}
                  onAdjust={() => setAdjustProduct(p)}
                  large
                />
              </FadeIn>
            ))
          )}
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
                {filteredProducts.map((p) => (
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
          {filteredProducts.length === 0 && (
            <p className="p-12 text-center text-sm text-muted">
              No products match your filters.{" "}
              <button
                type="button"
                onClick={clearFilters}
                className="font-medium text-primary hover:underline"
              >
                Clear Filters
              </button>
            </p>
          )}
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
