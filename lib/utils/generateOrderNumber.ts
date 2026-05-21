import { randomBytes } from "crypto";
import { format } from "date-fns";

/** ORD-YYYYMMDD-XXXXXX (6 hex chars, ~16M values per day). */
export function generateOrderNumber(referenceDate = new Date()): string {
  const datePart = format(referenceDate, "yyyyMMdd");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${datePart}-${suffix}`;
}

export function isOrderNumberDuplicateError(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "23505" &&
    (error.message?.includes("orders_order_number_key") ||
      error.message?.includes("order_number"))
  );
}
