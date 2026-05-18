import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-surface-secondary px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-muted dark:bg-zinc-800">
        <PackageOpen className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-heading">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Button asChild className="mt-6">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
