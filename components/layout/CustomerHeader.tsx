"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";

export function CustomerHeader() {
  const itemCount = useCart((s) => s.totalItems());

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
      <Link href="/home" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="MAHADEV"
          width={120}
          height={34}
          className="h-8 w-auto object-contain"
        />
        <span className="sr-only">MAHADEV Enterprises</span>
      </Link>
      <Link href="/cart" className="relative rounded-full p-2 hover:bg-gray-100">
        <ShoppingCart className="h-6 w-6 text-gray-700" />
        {itemCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {itemCount}
          </span>
        )}
      </Link>
    </header>
  );
}
