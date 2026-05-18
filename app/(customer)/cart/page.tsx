"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { placeOrder } from "@/lib/actions/order.actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } =
    useCart();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

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
      <h1 className="text-xl font-semibold">Cart ({items.length} items)</h1>

      <section className="space-y-3">
        {items.map(({ product, quantity }) => (
          <article
            key={product.id}
            className="flex gap-3 rounded-xl border bg-white p-3"
          >
            <section className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} fill className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-2xl">🍦</span>
              )}
            </section>
            <section className="flex-1">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-brand-700">
                {formatCurrency(product.price * quantity)}
              </p>
              <section className="mt-2 flex items-center justify-between">
                <section className="flex items-center gap-1 rounded border">
                  <button type="button" className="p-1" onClick={() => updateQuantity(product.id, quantity - 1)}>
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm">{quantity}</span>
                  <button type="button" className="p-1" onClick={() => updateQuantity(product.id, quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </button>
                </section>
                <button type="button" onClick={() => removeItem(product.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </section>
            </section>
          </article>
        ))}
      </section>

      <section className="rounded-xl border bg-white p-4">
        <section className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(totalAmount())}</span>
        </section>
        <section className="mt-2 flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span className="text-brand-700">{formatCurrency(totalAmount())}</span>
        </section>
      </section>

      {!confirm ? (
        <Button className="w-full" size="lg" onClick={() => setConfirm(true)}>
          Place Order
        </Button>
      ) : (
        <section className="space-y-2">
          <p className="text-center text-sm">
            Confirm order for {formatCurrency(totalAmount())}?
          </p>
          <Button className="w-full" onClick={handlePlaceOrder} disabled={loading}>
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
