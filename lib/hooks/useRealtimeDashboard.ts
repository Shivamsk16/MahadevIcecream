"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type RealtimeDashboardCallbacks = {
  onOrdersChange?: () => void;
  onProductsChange?: () => void;
};

/**
 * Subscribes to orders + products changes and refreshes dashboard data.
 */
export function useRealtimeDashboard(callbacks: RealtimeDashboardCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const supabase = createClient();

    const ordersChannel = supabase
      .channel("dashboard-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          console.log("[Dashboard] Realtime update received (orders)");
          callbacksRef.current.onOrdersChange?.();
        }
      )
      .subscribe((status) => {
        console.log("[Dashboard] orders channel status:", status);
      });

    const productsChannel = supabase
      .channel("dashboard-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          console.log("[Dashboard] Realtime update received (products)");
          callbacksRef.current.onProductsChange?.();
        }
      )
      .subscribe((status) => {
        console.log("[Dashboard] products channel status:", status);
      });

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
    };
  }, []);
}
