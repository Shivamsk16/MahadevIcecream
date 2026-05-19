"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Plus, Search } from "lucide-react";

type CustomerRow = Profile & {
  order_count: number;
  total_purchases: number;
};

type StatusFilter = "all" | "active" | "inactive";
type CustomerSort =
  | "newest"
  | "oldest"
  | "most_orders"
  | "highest_purchases"
  | "name_asc"
  | "name_desc";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<CustomerSort>("newest");
  const [cityFilter, setCityFilter] = useState("all");

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

  const cityOptions = useMemo(() => {
    const cities = new Set<string>();
    customers.forEach((c) => {
      if (c.city?.trim()) cities.add(c.city.trim());
    });
    return Array.from(cities).sort();
  }, [customers]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    sortBy !== "newest" ||
    cityFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
    setCityFilter("all");
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        (c.business_name?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.toLowerCase().includes(q) ?? false) ||
        (c.city?.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.is_active) ||
        (statusFilter === "inactive" && !c.is_active);
      const matchesCity =
        cityFilter === "all" || c.city?.trim() === cityFilter;
      return matchesSearch && matchesStatus && matchesCity;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "most_orders":
          return b.order_count - a.order_count;
        case "highest_purchases":
          return b.total_purchases - a.total_purchases;
        case "name_asc":
          return a.full_name.localeCompare(b.full_name);
        case "name_desc":
          return b.full_name.localeCompare(a.full_name);
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return list;
  }, [customers, search, statusFilter, sortBy, cityFilter]);

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

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative flex-1 lg:min-w-[200px] lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by name, business, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="form-input h-11 w-full lg:w-auto lg:min-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filter by status"
        >
          <option value="all">All Customers</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <select
          className="form-input h-11 w-full lg:w-auto lg:min-w-[180px]"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as CustomerSort)}
          aria-label="Sort customers"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most_orders">Most Orders</option>
          <option value="highest_purchases">Highest Purchases</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
        <select
          className="form-input h-11 w-full lg:w-auto lg:min-w-[160px]"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          aria-label="Filter by city"
        >
          <option value="all">All Cities</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      <section className="space-y-3 md:hidden">
        {filteredCustomers.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-500">
            No customers match your filters.{" "}
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-primary hover:underline"
            >
              Clear Filters
            </button>
          </p>
        ) : (
          filteredCustomers.map((c) => (
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
          ))
        )}
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
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted">
                  No customers match your filters.{" "}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="font-medium text-primary hover:underline"
                  >
                    Clear Filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => (
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
              ))
            )}
          </tbody>
        </table>
      </section>
    </section>
  );
}
