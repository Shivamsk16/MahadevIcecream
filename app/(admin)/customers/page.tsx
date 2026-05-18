"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Plus } from "lucide-react";

type CustomerRow = Profile & {
  order_count: number;
  total_purchases: number;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("full_name");

      const rows: CustomerRow[] = [];
      for (const p of profiles ?? []) {
        const { data: orders } = await supabase
          .from("orders")
          .select("net_amount")
          .eq("customer_id", p.id);
        rows.push({
          ...p,
          order_count: orders?.length ?? 0,
          total_purchases:
            orders?.reduce((s, o) => s + Number(o.net_amount), 0) ?? 0,
        });
      }
      setCustomers(rows);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <section className="flex justify-center py-16">
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Customers</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </section>

      <section className="space-y-3 md:hidden">
        {customers.map((c) => (
          <article key={c.id} className="rounded-xl border bg-white p-4">
            <p className="font-medium">{c.full_name}</p>
            {c.business_name && (
              <p className="text-sm text-gray-600">{c.business_name}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              {c.phone ?? "—"} · {c.city ?? "—"}
            </p>
            <section className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {c.order_count} orders · {formatCurrency(c.total_purchases)}
              </span>
              <span className={c.is_active ? "text-green-600" : "text-red-600"}>
                {c.is_active ? "Active" : "Inactive"}
              </span>
            </section>
          </article>
        ))}
      </section>

      <section className="hidden overflow-x-auto rounded-xl border bg-white md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Business</th>
              <th className="p-3">Phone</th>
              <th className="p-3">City</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Total Purchases</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-3 font-medium">{c.full_name}</td>
                <td className="p-3">{c.business_name ?? "—"}</td>
                <td className="p-3">{c.phone ?? "—"}</td>
                <td className="p-3">{c.city ?? "—"}</td>
                <td className="p-3">{c.order_count}</td>
                <td className="p-3">{formatCurrency(c.total_purchases)}</td>
                <td className="p-3">
                  <span
                    className={
                      c.is_active ? "text-green-600" : "text-red-600"
                    }
                  >
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
