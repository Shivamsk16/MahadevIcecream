"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MODES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type ThemeMode = (typeof MODES)[number]["value"];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("rounded-xl", className)}
        aria-label="Theme"
        disabled
      >
        <Sun className="h-5 w-5 opacity-50" />
      </Button>
    );
  }

  const current = (theme ?? "system") as ThemeMode;
  const ActiveIcon =
    current === "dark"
      ? Moon
      : current === "light"
        ? Sun
        : resolvedTheme === "dark"
          ? Moon
          : Sun;

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-xl text-muted hover:text-heading"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle theme"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <ActiveIcon className="h-5 w-5 transition-transform duration-300" />
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close theme menu"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            aria-label="Theme"
            className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lift dark:border-zinc-800 dark:bg-zinc-900/95 dark:backdrop-blur-xl"
          >
            {MODES.map(({ value, label, icon: Icon }) => (
              <li key={value} role="option" aria-selected={current === value}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    current === value
                      ? "bg-primary-soft text-primary dark:bg-red-950/40 dark:text-red-400"
                      : "text-muted hover:bg-neutral-100 hover:text-heading dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  )}
                  onClick={() => {
                    setTheme(value);
                    setOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
