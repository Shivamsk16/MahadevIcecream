import { Product, StockStatus } from "@/lib/types";
import {
  getProductStockStatus,
  getStockBadgeClasses,
  getStockStatusLabel,
} from "@/lib/utils/stock";
import { cn } from "@/lib/utils";

export function StockStatusBadge({
  product,
  status: statusProp,
  className,
}: {
  product?: Product;
  status?: StockStatus;
  className?: string;
}) {
  const status =
    statusProp ?? (product ? getProductStockStatus(product) : "in_stock");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        getStockBadgeClasses(status),
        className
      )}
    >
      {getStockStatusLabel(status)}
    </span>
  );
}

export function StockQuantityBadge({ product }: { product: Product }) {
  const status = getProductStockStatus(product);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        getStockBadgeClasses(status)
      )}
    >
      {product.stock_quantity}
    </span>
  );
}
