"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem } from "@/lib/types";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDate";
import {
  updateOrderStatus,
  updateDistributorAllocationQty,
} from "@/lib/actions/order.actions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import Link from "next/link";
import { Check } from "lucide-react";

function parseAllocationInput(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function getRowTotalForDisplay(item: OrderItem, allocationInput: string): number {
  const allocQty = parseAllocationInput(allocationInput);
  const qty = allocQty ?? item.quantity;
  return qty * item.product_price;
}

function OrderItemRow({
  item,
  onUpdate,
  onDraftChange,
}: {
  item: OrderItem;
  onUpdate: (updated: OrderItem) => void;
  onDraftChange: (itemId: string, inputValue: string) => void;
}) {
  const [inputValue, setInputValue] = useState(
    item.distributor_allocation_qty?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(item.distributor_allocation_qty?.toString() ?? "");
  }, [item.distributor_allocation_qty]);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(timer);
  }, [saved]);

  const rowTotal = getRowTotalForDisplay(item, inputValue);

  async function save() {
    const trimmed = inputValue.trim();
    const parsed =
      trimmed === "" ? null : Number.parseInt(trimmed, 10);

    if (trimmed !== "" && (!Number.isInteger(parsed) || parsed! <= 0)) {
      setError("Enter a positive whole number");
      setInputValue(item.distributor_allocation_qty?.toString() ?? "");
      return;
    }

    if (parsed === item.distributor_allocation_qty) {
      setError(null);
      return;
    }

    const previous = item.distributor_allocation_qty ?? null;
    setSaving(true);
    setError(null);
    onUpdate({ ...item, distributor_allocation_qty: parsed });

    try {
      await updateDistributorAllocationQty(item.id, parsed);
      setSaved(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save";
      setError(message);
      toast.error(message);
      onUpdate({ ...item, distributor_allocation_qty: previous });
      const reverted = previous?.toString() ?? "";
      setInputValue(reverted);
      onDraftChange(item.id, reverted);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  }

  return (
    <tr className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80 dark:border-zinc-800/80 dark:hover:bg-zinc-800/50">
      <td className="p-3 text-body dark:text-zinc-300">{item.product_name}</td>
      <td className="p-3 text-body dark:text-zinc-300">{item.quantity}</td>
      <td className="p-3">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            step={1}
            placeholder="—"
            value={inputValue}
            disabled={saving}
            onChange={(e) => {
              const next = e.target.value;
              setInputValue(next);
              onDraftChange(item.id, next);
              setError(null);
            }}
            onBlur={() => void save()}
            onKeyDown={handleKeyDown}
            className="w-20 rounded border border-neutral-200 bg-white px-2 py-1 text-sm text-heading shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-red-900/30 dark:disabled:bg-zinc-800"
            aria-label={`Distributor allocation qty for ${item.product_name}`}
          />
          {saved && (
            <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Saved
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </td>
      <td className="p-3 tabular-nums text-body dark:text-zinc-300">
        {formatCurrency(rowTotal)}
      </td>
      <td className="p-3 tabular-nums text-body dark:text-zinc-300">
        {formatCurrency(rowTotal)}
      </td>
    </tr>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftAllocations, setDraftAllocations] = useState<Record<string, string>>(
    {}
  );

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, customer:profiles(*), order_items(*)")
      .eq("id", id)
      .single();
    setOrder(data as Order);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  const displayGrandTotal = useMemo(() => {
    if (!order?.order_items?.length) return 0;
    return order.order_items.reduce((sum, item) => {
      const allocationInput =
        draftAllocations[item.id] ??
        (item.distributor_allocation_qty?.toString() ?? "");
      return sum + getRowTotalForDisplay(item, allocationInput);
    }, 0);
  }, [order?.order_items, draftAllocations]);

  function handleDraftChange(itemId: string, inputValue: string) {
    setDraftAllocations((prev) => ({ ...prev, [itemId]: inputValue }));
  }

  function handleItemUpdate(updated: OrderItem) {
    setOrder((prev) => {
      if (!prev?.order_items) return prev;
      return {
        ...prev,
        order_items: prev.order_items.map((i) =>
          i.id === updated.id ? updated : i
        ),
      };
    });
  }

  async function updateStatus(status: Order["status"]) {
    try {
      await updateOrderStatus(id, status);
      toast.success("Status updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading) {
    return (
      <section className="flex justify-center py-16">
        <LoadingSpinner />
      </section>
    );
  }

  if (!order) {
    return <p className="text-muted dark:text-zinc-400">Order not found</p>;
  }

  const customer = order.customer as {
    full_name?: string;
    phone?: string;
  };

  return (
    <section className="space-y-6">
      <Link
        href="/admin/orders"
        className="text-sm text-brand-600 hover:underline dark:text-red-400"
      >
        ← Back to Orders
      </Link>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <section>
          <h1 className="text-xl font-bold text-heading dark:text-zinc-100 sm:text-2xl">
            {order.order_number}
          </h1>
          <OrderStatusBadge status={order.status} />
        </section>
        <select
          className="form-input w-full sm:w-auto"
          value={order.status}
          onChange={(e) => updateStatus(e.target.value as Order["status"])}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-surface p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-dark-card">
        <p className="text-body dark:text-zinc-300">
          <strong className="text-heading dark:text-zinc-100">Customer:</strong>{" "}
          {customer?.full_name ?? "—"}
        </p>
        <p className="text-body dark:text-zinc-300">
          <strong className="text-heading dark:text-zinc-100">Phone:</strong>{" "}
          {customer?.phone ?? "—"}
        </p>
        <p className="text-body dark:text-zinc-300">
          <strong className="text-heading dark:text-zinc-100">Placed:</strong>{" "}
          {formatDateTime(order.placed_at)}
        </p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-neutral-200 bg-surface shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-dark-card">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left dark:border-zinc-800 dark:bg-zinc-900/95">
              <th className="p-3 font-medium text-muted dark:text-zinc-500">
                Product
              </th>
              <th className="p-3 font-medium text-muted dark:text-zinc-500">
                Qty
              </th>
              <th className="p-3 font-medium text-muted dark:text-zinc-500">
                Distributor Allocation Qty
              </th>
              <th className="p-3 font-medium text-muted dark:text-zinc-500">
                Price
              </th>
              <th className="p-3 font-medium text-muted dark:text-zinc-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {order.order_items?.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                onUpdate={handleItemUpdate}
                onDraftChange={handleDraftChange}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200 dark:border-zinc-800">
              <td
                colSpan={4}
                className="p-3 text-right font-semibold text-heading dark:text-zinc-100"
              >
                TOTAL
              </td>
              <td className="p-3 font-bold tabular-nums text-brand-700 dark:text-red-400">
                {formatCurrency(displayGrandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </section>
  );
}
