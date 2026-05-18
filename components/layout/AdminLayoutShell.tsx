"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950 lg:flex">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm dark:bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <AdminSidebar
        showClose
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onNavigate={() => setMenuOpen(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          sidebarCollapsed={collapsed}
          onMenuClick={() => setMenuOpen(true)}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
