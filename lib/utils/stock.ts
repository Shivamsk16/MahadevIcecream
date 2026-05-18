import { Product, StockStatus } from "@/lib/types";

export function getStockStatus(
  stockQuantity: number,
  lowStockThreshold: number
): StockStatus {
  if (stockQuantity <= 0) return "out_of_stock";
  if (stockQuantity <= lowStockThreshold) return "low_stock";
  return "in_stock";
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "in_stock":
      return "In Stock";
    case "low_stock":
      return "Low Stock";
    case "out_of_stock":
      return "Out of Stock";
  }
}

export function getStockBadgeClasses(status: StockStatus): string {
  switch (status) {
    case "in_stock":
      return "border-green-200 bg-success-soft text-success dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-400";
    case "low_stock":
      return "border-amber-200 bg-warning-soft text-warning dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400";
    case "out_of_stock":
      return "border-red-200 bg-danger-soft text-danger dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400";
  }
}

export function getProductStockStatus(product: Product): StockStatus {
  return getStockStatus(
    product.stock_quantity,
    product.low_stock_threshold ?? 10
  );
}
