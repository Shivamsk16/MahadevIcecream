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
      return "border-transparent bg-green-100 text-green-800";
    case "low_stock":
      return "border-transparent bg-amber-100 text-amber-800";
    case "out_of_stock":
      return "border-transparent bg-red-100 text-red-800";
  }
}

export function getProductStockStatus(product: Product): StockStatus {
  return getStockStatus(
    product.stock_quantity,
    product.low_stock_threshold ?? 10
  );
}
