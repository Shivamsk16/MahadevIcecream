"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/lib/hooks/useCart";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;

  const threshold = product.low_stock_threshold ?? 10;
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock =
    product.stock_quantity > 0 && product.stock_quantity <= threshold;

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-neutral-200 bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-dark-card dark:hover:shadow-dark-lift",
        isOutOfStock && "opacity-90"
      )}
    >
      <div className="relative aspect-square bg-surface-secondary dark:bg-zinc-800/50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-all duration-300 group-hover:scale-[1.02]",
              isOutOfStock && "grayscale"
            )}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <span
            className={cn(
              "flex h-full items-center justify-center text-4xl",
              isOutOfStock && "grayscale opacity-60"
            )}
          >
            🍦
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/30 backdrop-blur-[2px] dark:bg-black/50">
            <Badge variant="cancelled" className="text-xs">
              Out of Stock
            </Badge>
          </div>
        )}
        {isLowStock && (
          <Badge className="absolute right-2 top-2 border-amber-200 bg-warning-soft text-warning hover:bg-warning-soft">
            {product.stock_quantity} left
          </Badge>
        )}
        {product.scheme_label && !isLowStock && !isOutOfStock && (
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 text-xs"
          >
            {product.scheme_label}
          </Badge>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-heading">
          {product.name}
        </h3>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-heading">
            {formatCurrency(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-muted line-through">
              {formatCurrency(product.mrp)}
            </span>
          )}
        </p>
        {qty > 0 && !isOutOfStock ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-neutral-200 bg-surface-secondary p-1 dark:border-zinc-700 dark:bg-zinc-800/50">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-heading transition-colors hover:bg-surface dark:hover:bg-zinc-700"
              onClick={() => updateQuantity(product.id, qty - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-heading transition-colors hover:bg-surface disabled:opacity-40 dark:hover:bg-zinc-700"
              disabled={qty >= product.stock_quantity}
              onClick={() => updateQuantity(product.id, qty + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button
            className="mt-3 w-full"
            size="sm"
            disabled={isOutOfStock}
            onClick={() => addItem(product)}
          >
            {isOutOfStock ? "Unavailable" : "Add to Cart"}
          </Button>
        )}
      </div>
    </article>
  );
}
