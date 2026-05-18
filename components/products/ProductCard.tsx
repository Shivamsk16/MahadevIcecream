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
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <section className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className={cn("object-cover", isOutOfStock && "opacity-50")}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <span
            className={cn(
              "flex h-full items-center justify-center text-4xl",
              isOutOfStock && "opacity-50"
            )}
          >
            🍦
          </span>
        )}
        {isOutOfStock && (
          <section className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white">
              Out of Stock
            </span>
          </section>
        )}
        {isLowStock && (
          <Badge className="absolute right-2 top-2 border-transparent bg-amber-500 text-xs text-white hover:bg-amber-500">
            Only {product.stock_quantity} left!
          </Badge>
        )}
        {product.scheme_label && !isLowStock && (
          <Badge className="absolute left-2 top-2 text-xs">
            {product.scheme_label}
          </Badge>
        )}
        {product.scheme_label && isLowStock && (
          <Badge className="absolute left-2 top-2 text-xs">
            {product.scheme_label}
          </Badge>
        )}
      </section>
      <section className="p-3">
        <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold text-brand-700">
            {formatCurrency(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(product.mrp)}
            </span>
          )}
        </p>
        {qty > 0 && !isOutOfStock ? (
          <section className="mt-3 flex items-center justify-between">
            <section className="flex items-center gap-2 rounded-lg border">
              <button
                type="button"
                className="p-2"
                onClick={() => updateQuantity(product.id, qty - 1)}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-medium">{qty}</span>
              <button
                type="button"
                className="p-2 disabled:opacity-40"
                disabled={qty >= product.stock_quantity}
                onClick={() => updateQuantity(product.id, qty + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </section>
          </section>
        ) : (
          <Button
            className={cn(
              "mt-3 w-full",
              isOutOfStock && "cursor-not-allowed opacity-50"
            )}
            size="sm"
            disabled={isOutOfStock}
            onClick={() => addItem(product)}
          >
            Add to Cart
          </Button>
        )}
      </section>
    </article>
  );
}
