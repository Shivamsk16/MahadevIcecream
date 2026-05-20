import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/lib/types";

type DisplayOrderStatus = OrderStatus | "preparing" | "out_for_delivery";

const variantMap: Record<
  DisplayOrderStatus,
  "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"
> = {
  pending: "pending",
  confirmed: "confirmed",
  preparing: "preparing",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  cancelled: "cancelled",
};

const statusLabel: Record<DisplayOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: DisplayOrderStatus }) {
  return (
    <Badge
      variant={variantMap[status]}
      className="whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold transition-all duration-300"
    >
      {statusLabel[status]}
    </Badge>
  );
}
