"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { adjustProductStock } from "@/lib/actions/stock.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AdjustStockModalProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function AdjustStockModal({
  product,
  open,
  onOpenChange,
  onSuccess,
}: AdjustStockModalProps) {
  const [action, setAction] = useState<"add" | "deduct">("add");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setAction("add");
      setQuantity("");
      setNote("");
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      toast.error("Enter a positive quantity");
      return;
    }

    setLoading(true);
    try {
      await adjustProductStock(product.id, action, qty, note);
      toast.success(
        action === "add"
          ? `Added ${qty} units to stock`
          : `Deducted ${qty} units from stock`
      );
      handleOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Add or remove inventory for this product. Changes are logged.
          </DialogDescription>
        </DialogHeader>

        {product && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <section className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-900">{product.name}</p>
              <p className="mt-1 text-gray-600">
                Current stock:{" "}
                <span className="font-semibold">{product.stock_quantity}</span>
              </p>
            </section>

            <section>
              <Label>Action</Label>
              <section className="mt-2 flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    action === "add"
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setAction("add")}
                >
                  Add Stock
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    action === "deduct"
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setAction("deduct")}
                >
                  Deduct Stock
                </button>
              </section>
            </section>

            <section>
              <Label htmlFor="adjust-qty">Quantity</Label>
              <Input
                id="adjust-qty"
                type="number"
                min={1}
                step={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
              />
            </section>

            <section>
              <Label htmlFor="adjust-note">Note (optional)</Label>
              <Input
                id="adjust-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. New stock received"
              />
            </section>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
