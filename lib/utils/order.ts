import { Order } from "@/lib/types";

/** Normalize Supabase embed (object or single-element array). */
export function getOrderCustomerName(
  order: Order | Record<string, unknown>
): string {
  const raw = order as Record<string, unknown>;
  const customer = raw.customer ?? raw.profiles;

  if (Array.isArray(customer)) {
    const first = customer[0] as { full_name?: string } | undefined;
    return first?.full_name ?? "—";
  }

  if (customer && typeof customer === "object") {
    return (customer as { full_name?: string }).full_name ?? "—";
  }

  return "—";
}

export function normalizeOrder<T extends Record<string, unknown>>(row: T): T & {
  customer?: { full_name?: string };
} {
  const customer = row.customer ?? row.profiles;
  if (Array.isArray(customer) && customer[0]) {
    return { ...row, customer: customer[0] as { full_name?: string } };
  }
  if (customer && typeof customer === "object" && !Array.isArray(customer)) {
    return { ...row, customer: customer as { full_name?: string } };
  }
  return row as T & { customer?: { full_name?: string } };
}
