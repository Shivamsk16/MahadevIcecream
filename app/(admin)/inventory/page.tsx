"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Product, StockLog, StockStatus } from "@/lib/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  StockQuantityBadge,
  StockStatusBadge,
} from "@/components/inventory/StockStatusBadge";
import { AdjustStockModal } from "@/components/inventory/AdjustStockModal";
import { adjustProductStock } from "@/lib/actions/stock.actions";
import { toast } from "sonner";
import { getProductStockStatus } from "@/lib/utils/stock";
import { formatDateTime } from "@/lib/utils/formatDate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Package,
  AlertTriangle,
  PackageX,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { MetricCardSkeleton } from "@/components/shared/Skeleton";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | StockStatus;
type StockSort = "default" | "low_to_high" | "high_to_low" | "recently_updated";

function getCategoryName(p: Product) {
  return (p.category as { name?: string })?.name ?? "";
}

const CHANGE_LABELS: Record<string, string> = {
  manual_add: "Manual Add",
  manual_deduct: "Manual Deduct",
  order_placed: "Order Placed",
  order_cancelled: "Order Cancelled",
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockSort, setStockSort] = useState<StockSort>("default");
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [purchaseInputs, setPurchaseInputs] = useState<Record<string, string>>(
    {}
  );
  const [bulkPurchasing, setBulkPurchasing] = useState(false);
  const scrollYRef = useRef(0);

  const loadProducts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .order("stock_quantity", { ascending: true });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
    const supabase = createClient();
    const channel = supabase
      .channel("inventory-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => loadProducts()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProducts]);

  const counts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    products.forEach((p) => {
      const s = getProductStockStatus(p);
      if (s === "in_stock") inStock++;
      else if (s === "low_stock") lowStock++;
      else outOfStock++;
    });
    return {
      total: products.length,
      inStock,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    products.forEach((p) => {
      const name = getCategoryName(p);
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [products]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    stockSort !== "default";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setStockSort("default");
  }

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const status = getProductStockStatus(p);
      const matchesStatus =
        statusFilter === "all" || status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || getCategoryName(p) === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    if (stockSort === "low_to_high") {
      list = [...list].sort((a, b) => a.stock_quantity - b.stock_quantity);
    } else if (stockSort === "high_to_low") {
      list = [...list].sort((a, b) => b.stock_quantity - a.stock_quantity);
    } else if (stockSort === "recently_updated") {
      list = [...list].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }

    return list;
  }, [products, search, statusFilter, categoryFilter, stockSort]);

  const stagedPurchases = useMemo(() => {
    return products
      .map((p) => ({
        product: p,
        raw: purchaseInputs[p.id]?.trim() ?? "",
      }))
      .filter(({ raw }) => raw !== "");
  }, [products, purchaseInputs]);

  const hasStagedPurchases = stagedPurchases.length > 0;

  async function loadStockLogs(productId: string) {
    setLogsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("stock_logs")
      .select(
        "*, order:orders(order_number), changer:profiles(full_name)"
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    setStockLogs((data as StockLog[]) ?? []);
    setLogsLoading(false);
  }

  function openStockHistory(product: Product) {
    scrollYRef.current = window.scrollY;
    setHistoryProduct(product);
    setHistoryOpen(true);
    void loadStockLogs(product.id);
  }

  function closeStockHistory() {
    setHistoryProduct(null);
    setStockLogs([]);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollYRef.current);
    });
  }

  async function handleBulkPurchaseConfirm() {
    if (!hasStagedPurchases || bulkPurchasing) return;

    const validated: { product: Product; qty: number }[] = [];
    for (const { product, raw } of stagedPurchases) {
      const qty = parseInt(raw, 10);
      if (!Number.isInteger(qty) || qty <= 0) {
        toast.error(
          `Enter a valid positive number for ${product.name}`
        );
        return;
      }
      validated.push({ product, qty });
    }

    setBulkPurchasing(true);
    const processedIds: string[] = [];
    try {
      for (const { product, qty } of validated) {
        await adjustProductStock(product.id, "add", qty, "Purchase");
        processedIds.push(product.id);
      }
      toast.success(
        validated.length === 1
          ? `Added ${validated[0].qty} units to ${validated[0].product.name}`
          : `Updated stock for ${validated.length} products`
      );
      setPurchaseInputs((prev) => {
        const next = { ...prev };
        processedIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      await loadProducts();
      if (
        historyProduct &&
        processedIds.includes(historyProduct.id)
      ) {
        await loadStockLogs(historyProduct.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add stock");
    } finally {
      setBulkPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Inventory" description="Loading…" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        description="Track stock levels, alerts, and movement history"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Products"
          value={counts.total}
          icon={Package}
          onClick={() => setStatusFilter("all")}
          className={cn(statusFilter === "all" && "ring-2 ring-primary/30")}
        />
        <MetricCard
          label="In Stock"
          value={counts.inStock}
          onClick={() => setStatusFilter("in_stock")}
          className={cn(statusFilter === "in_stock" && "ring-2 ring-primary/30")}
        />
        <MetricCard
          label="Low Stock"
          value={counts.lowStock}
          icon={AlertTriangle}
          onClick={() => setStatusFilter("low_stock")}
          className={cn(statusFilter === "low_stock" && "ring-2 ring-primary/30")}
        />
        <MetricCard
          label="Out of Stock"
          value={counts.outOfStock}
          icon={PackageX}
          onClick={() => setStatusFilter("out_of_stock")}
          className={cn(
            statusFilter === "out_of_stock" && "ring-2 ring-primary/30"
          )}
        />
      </section>

      <FadeIn className="sticky top-16 z-20 -mx-1 rounded-2xl border border-neutral-200 bg-surface/95 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="form-input h-11 w-full sm:w-auto sm:min-w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by stock status"
          >
            <option value="all">All statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <select
            className="form-input h-11 w-full sm:w-auto sm:min-w-[160px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            className="form-input h-11 w-full sm:w-auto sm:min-w-[180px]"
            value={stockSort}
            onChange={(e) => setStockSort(e.target.value as StockSort)}
            aria-label="Sort by stock"
          >
            <option value="default">Sort: Default</option>
            <option value="low_to_high">Stock: Low to High</option>
            <option value="high_to_low">Stock: High to Low</option>
            <option value="recently_updated">Recently Updated</option>
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
      </FadeIn>

      <div className="table-container">
        <div className="max-h-[560px] overflow-auto">
          <table className="data-table min-w-[960px]">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Purchase</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className={cn(
                    "cursor-pointer",
                    historyProduct?.id === p.id && "bg-primary-soft/40"
                  )}
                  onClick={() => openStockHistory(p)}
                >
                  <td>
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-surface-secondary">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-lg">
                          🍦
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-medium text-heading">{p.name}</td>
                  <td className="text-muted">
                    {(p.category as { name?: string })?.name ?? "—"}
                  </td>
                  <td>
                    <StockQuantityBadge product={p} />
                  </td>
                  <td className="tabular-nums text-muted">
                    {p.low_stock_threshold ?? 10}
                  </td>
                  <td>
                    <StockStatusBadge product={p} />
                  </td>
                  <td className="text-muted">
                    {formatDateTime(p.updated_at)}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Qty"
                      value={purchaseInputs[p.id] ?? ""}
                      disabled={bulkPurchasing}
                      onChange={(e) =>
                        setPurchaseInputs((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && hasStagedPurchases) {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleBulkPurchaseConfirm();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-20 text-xs"
                      aria-label={`Purchase quantity for ${p.name}`}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAdjustProduct(p)}
                    >
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
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
        {hasStagedPurchases && (
          <div className="flex justify-end border-t border-neutral-200 px-6 py-4 dark:border-zinc-800">
            <Button
              disabled={bulkPurchasing}
              onClick={() => void handleBulkPurchaseConfirm()}
            >
              {bulkPurchasing ? "Processing…" : "Confirm Changes"}
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={!!historyProduct}
        onOpenChange={(open) => {
          if (!open) closeStockHistory();
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {historyProduct
                ? `Stock history — ${historyProduct.name}`
                : "Stock history"}
            </DialogTitle>
          </DialogHeader>
          {historyProduct && (
            <div className="dashboard-card overflow-hidden border-0 shadow-none">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-6 py-4 dark:border-zinc-800">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setHistoryOpen((o) => !o)}
                >
                  <span className="font-semibold text-heading">
                    Stock history — {historyProduct.name}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded-lg p-1 text-muted opacity-70 transition-opacity hover:bg-neutral-100 hover:opacity-100 focus:outline-none focus:ring-4 focus:ring-red-100 dark:hover:bg-zinc-800 dark:focus:ring-red-900/30"
                    onClick={() => setHistoryOpen((o) => !o)}
                    aria-expanded={historyOpen}
                    aria-label={
                      historyOpen ? "Collapse history" : "Expand history"
                    }
                  >
                    {historyOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-muted opacity-70 transition-opacity hover:bg-neutral-100 hover:opacity-100 focus:outline-none focus:ring-4 focus:ring-red-100 dark:hover:bg-zinc-800 dark:focus:ring-red-900/30"
                    onClick={closeStockHistory}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {historyOpen && (
                <div className="max-h-80 overflow-auto p-2">
                  {logsLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : stockLogs.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted">
                      No stock movements yet
                    </p>
                  ) : (
                    <ul className="space-y-0 divide-y divide-neutral-100">
                      {stockLogs.map((log) => (
                        <li
                          key={log.id}
                          className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-heading">
                              {CHANGE_LABELS[log.change_type] ??
                                log.change_type}
                            </p>
                            <p className="text-xs text-muted">
                              {formatDateTime(log.created_at)}
                              {(log.changer as { full_name?: string })
                                ?.full_name &&
                                ` · ${(log.changer as { full_name?: string }).full_name}`}
                            </p>
                            {log.note && (
                              <p className="mt-1 text-xs text-muted">
                                {log.note}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm tabular-nums">
                            <span className="text-muted">
                              {log.quantity_before} → {log.quantity_after}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                log.quantity_change >= 0
                                  ? "bg-success-soft text-success"
                                  : "bg-danger-soft text-danger"
                              )}
                            >
                              {log.quantity_change >= 0 ? "+" : ""}
                              {log.quantity_change}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4 dark:border-zinc-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={closeStockHistory}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAdjustProduct(historyProduct);
                    setHistoryProduct(null);
                  }}
                >
                  Deduct stock
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdjustStockModal
        product={adjustProduct}
        open={!!adjustProduct}
        onOpenChange={(open) => !open && setAdjustProduct(null)}
        onSuccess={() => {
          loadProducts();
          if (historyProduct) void loadStockLogs(historyProduct.id);
        }}
      />
    </div>
  );
}
