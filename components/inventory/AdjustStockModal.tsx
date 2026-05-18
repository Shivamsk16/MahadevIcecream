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
import { cn } from "@/lib/utils";

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
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            Add or remove inventory. All changes are logged.
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
              <Label>Action</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["add", "deduct"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      action === type
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-neutral-200 text-muted hover:bg-neutral-50"
                    )}
                    onClick={() => setAction(type)}
                  >
                    {type === "add" ? "Add stock" : "Deduct stock"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-note">Note (optional)</Label>
              <Input
                id="adjust-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. New stock received"
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
                {loading ? "Saving…" : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
