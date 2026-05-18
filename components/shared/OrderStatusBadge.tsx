import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/lib/types";

const variantMap: Record<
  OrderStatus,
  "pending" | "confirmed" | "delivered" | "cancelled"
> = {
  pending: "pending",
  confirmed: "confirmed",
  delivered: "delivered",
  cancelled: "cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={variantMap[status]} className="capitalize">
      {status}
    </Badge>
  );
}
