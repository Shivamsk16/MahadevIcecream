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
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
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
      await adjustProductStock(
        product.id,
        "deduct",
        qty,
        note.trim() || undefined
      );
      toast.success(`Deducted ${qty} units from stock`);
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
          <DialogTitle>Deduct stock</DialogTitle>
          <DialogDescription>
            Manually reduce inventory for damaged, expired, or lost stock. All
            changes are logged.
          </DialogDescription>
        </DialogHeader>

        {product && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-neutral-200 bg-surface-secondary p-4 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="font-medium text-heading">{product.name}</p>
              <p className="mt-1 text-muted">
                Current stock:{" "}
                <span className="font-semibold tabular-nums text-heading">
                  {product.stock_quantity}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-qty">Quantity to deduct</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-note">Reason (optional)</Label>
              <Input
                id="adjust-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Damaged goods, expired stock"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Confirm Deduction"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
