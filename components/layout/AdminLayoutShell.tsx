"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="min-h-screen bg-gray-50 lg:flex">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <AdminSidebar
        showClose
        onNavigate={() => setMenuOpen(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-display text-lg font-bold text-brand-700">
            MAHADEV Admin
          </span>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </section>
    </section>
  );
}
