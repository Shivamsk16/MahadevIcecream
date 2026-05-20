"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { placeOrder } from "@/lib/actions/order.actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/lib/types";

type StockMap = Record<string, Pick<Product, "stock_quantity" | "low_stock_threshold" | "name">>;

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } =
    useCart();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [stockMap, setStockMap] = useState<StockMap>({});
  const [stockLoading, setStockLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function validateStock() {
      if (items.length === 0) {
        setStockMap({});
        setStockLoading(false);
        return;
      }
      setStockLoading(true);
      const supabase = createClient();
      const ids = items.map((i) => i.product.id);
      const { data } = await supabase
        .from("products")
        .select("id, name, stock_quantity, low_stock_threshold")
        .in("id", ids);

      const map: StockMap = {};
      (data ?? []).forEach((p) => {
        map[p.id] = {
          name: p.name,
          stock_quantity: p.stock_quantity,
          low_stock_threshold: p.low_stock_threshold ?? 10,
        };
      });
      setStockMap(map);
      setStockLoading(false);
    }
    validateStock();
  }, [items]);

  const itemIssues = useMemo(() => {
    return items.map(({ product, quantity }) => {
      const live = stockMap[product.id];
      const stock = live?.stock_quantity ?? product.stock_quantity;
      const threshold = live?.low_stock_threshold ?? product.low_stock_threshold ?? 10;
      const outOfStock = stock <= 0;
      const lowStock = stock > 0 && stock <= threshold;
      const exceedsStock = quantity > stock && stock > 0;
      return { outOfStock, lowStock, stock, exceedsStock };
    });
  }, [items, stockMap]);

  const hasBlockingIssue = itemIssues.some((i) => i.outOfStock);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add some delicious ice cream!"
        actionLabel="Browse Products"
        actionHref="/products"
      />
    );
  }

  async function handlePlaceOrder() {
    setLoading(true);
    try {
      const result = await placeOrder(items);
      clearCart();
      toast.success(`Order #${result.order_number} placed!`);
      router.push("/orders");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-heading dark:text-zinc-100">
        Cart ({items.length} items)
      </h1>

      <section className="space-y-3">
        {items.map(({ product, quantity }, index) => {
          const issue = itemIssues[index];
          return (
            <article
              key={product.id}
              className="flex gap-3 rounded-xl border border-neutral-200 bg-surface p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-dark-card"
            >
              <section className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-secondary dark:bg-zinc-800/50">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-2xl">🍦</span>
                )}
              </section>
              <section className="flex-1">
                <p className="font-medium text-heading dark:text-zinc-100">
                  {product.name}
                </p>
                <p className="text-sm text-brand-700 dark:text-red-400">
                  {formatCurrency(product.price * quantity)}
                </p>
                {issue?.outOfStock && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    This item is no longer available
                  </p>
                )}
                {issue?.lowStock && !issue.outOfStock && (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                    Only {issue.stock} left — your quantity may be adjusted
                  </p>
                )}
                <section className="mt-2 flex items-center justify-between">
                  <section className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-surface-secondary dark:border-zinc-700 dark:bg-zinc-800/50">
                    <button
                      type="button"
                      className="p-1 text-heading transition-colors hover:bg-surface dark:text-zinc-100 dark:hover:bg-zinc-700"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm text-heading dark:text-zinc-100">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className="p-1 text-heading transition-colors hover:bg-surface dark:text-zinc-100 dark:hover:bg-zinc-700"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </section>
                  <button type="button" onClick={() => removeItem(product.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </section>
              </section>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-surface p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-dark-card">
        <section className="flex justify-between text-sm text-body dark:text-zinc-300">
          <span>Subtotal</span>
          <span>{formatCurrency(totalAmount())}</span>
        </section>
        <section className="mt-2 flex justify-between border-t border-neutral-200 pt-2 font-semibold dark:border-zinc-800">
          <span className="text-heading dark:text-zinc-100">Total</span>
          <span className="text-brand-700 dark:text-red-400">
            {formatCurrency(totalAmount())}
          </span>
        </section>
      </section>

      {!confirm ? (
        <Button
          className="w-full"
          size="lg"
          onClick={() => setConfirm(true)}
          disabled={stockLoading || hasBlockingIssue}
        >
          Place Order
        </Button>
      ) : (
        <section className="space-y-2">
          <p className="text-center text-sm text-muted dark:text-zinc-400">
            Confirm order for {formatCurrency(totalAmount())}?
          </p>
          <Button
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={loading || hasBlockingIssue}
          >
            {loading ? "Placing..." : "Confirm Order"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
        </section>
      )}
    </section>
  );
}
