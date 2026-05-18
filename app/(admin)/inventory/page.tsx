"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getProductStockStatus } from "@/lib/utils/stock";
import { formatDateTime } from "@/lib/utils/formatDate";
import { ChevronDown, ChevronUp } from "lucide-react";

type StatusFilter = "all" | StockStatus;

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
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);

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

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const status = getProductStockStatus(p);
      const matchesStatus =
        statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

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

  function selectProduct(product: Product) {
    if (selectedProductId === product.id) {
      setSelectedProductId(null);
      setStockLogs([]);
      return;
    }
    setSelectedProductId(product.id);
    setHistoryOpen(true);
    loadStockLogs(product.id);
  }

  if (loading) {
    return (
      <section className="flex justify-center py-16">
        <LoadingSpinner />
      </section>
    );
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Inventory</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Products", value: counts.total, filter: "all" as const },
          {
            label: "In Stock",
            value: counts.inStock,
            filter: "in_stock" as const,
          },
          {
            label: "Low Stock",
            value: counts.lowStock,
            filter: "low_stock" as const,
          },
          {
            label: "Out of Stock",
            value: counts.outOfStock,
            filter: "out_of_stock" as const,
          },
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => setStatusFilter(card.filter)}
            className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-brand-200 ${
              statusFilter === card.filter ? "ring-2 ring-brand-500" : ""
            }`}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by product name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          className="h-10 rounded-md border border-gray-300 px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Image</th>
              <th className="p-3">Product Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Current Stock</th>
              <th className="p-3">Threshold</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Updated</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className={`cursor-pointer border-b hover:bg-gray-50 ${
                  selectedProductId === p.id ? "bg-brand-50/50" : ""
                }`}
                onClick={() => selectProduct(p)}
              >
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
                <td className="p-3">
                  <StockQuantityBadge product={p} />
                </td>
                <td className="p-3">{p.low_stock_threshold ?? 10}</td>
                <td className="p-3">
                  <StockStatusBadge product={p} />
                </td>
                <td className="p-3 text-gray-500">
                  {formatDateTime(p.updated_at)}
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdjustProduct(p);
                    }}
                  >
                    Adjust Stock
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-gray-400">No products match your filters</p>
        )}
      </section>

      {selectedProduct && (
        <article className="rounded-xl border bg-white">
          <button
            type="button"
            className="flex w-full items-center justify-between border-b p-4 text-left font-semibold"
            onClick={() => setHistoryOpen((o) => !o)}
          >
            <span>
              Stock History — {selectedProduct.name}
            </span>
            {historyOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {historyOpen && (
            <section className="overflow-x-auto">
              {logsLoading ? (
                <section className="flex justify-center p-8">
                  <LoadingSpinner />
                </section>
              ) : stockLogs.length === 0 ? (
                <p className="p-8 text-center text-gray-400">No stock movements yet</p>
              ) : (
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left">
                      <th className="p-3">Date/Time</th>
                      <th className="p-3">Change Type</th>
                      <th className="p-3">Qty Before</th>
                      <th className="p-3">Change</th>
                      <th className="p-3">Qty After</th>
                      <th className="p-3">Order #</th>
                      <th className="p-3">Note</th>
                      <th className="p-3">Changed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockLogs.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="p-3">{formatDateTime(log.created_at)}</td>
                        <td className="p-3">
                          {CHANGE_LABELS[log.change_type] ?? log.change_type}
                        </td>
                        <td className="p-3">{log.quantity_before}</td>
                        <td className="p-3">
                          <span
                            className={
                              log.quantity_change >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {log.quantity_change >= 0 ? "+" : ""}
                            {log.quantity_change}
                          </span>
                        </td>
                        <td className="p-3">{log.quantity_after}</td>
                        <td className="p-3">
                          {(log.order as { order_number?: string })?.order_number ??
                            "—"}
                        </td>
                        <td className="p-3 max-w-[160px] truncate">
                          {log.note ?? "—"}
                        </td>
                        <td className="p-3">
                          {(log.changer as { full_name?: string })?.full_name ??
                            "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </article>
      )}

      <AdjustStockModal
        product={adjustProduct}
        open={!!adjustProduct}
        onOpenChange={(open) => !open && setAdjustProduct(null)}
        onSuccess={() => {
          loadProducts();
          if (selectedProductId) loadStockLogs(selectedProductId);
        }}
      />
    </section>
  );
}
