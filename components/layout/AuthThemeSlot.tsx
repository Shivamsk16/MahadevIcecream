"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AuthThemeSlot() {
  return (
    <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-8">
      <ThemeToggle />
    </div>
  );
}
