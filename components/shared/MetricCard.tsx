"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion/FadeIn";

type MetricCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  delay?: number;
  className?: string;
  onClick?: () => void;
};

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  trend = "neutral",
  delay = 0,
  className,
  onClick,
}: MetricCardProps) {
  const Comp = onClick ? "button" : "article";

  return (
    <FadeIn delay={delay}>
      <Comp
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className={cn(
          "metric-card group w-full text-left",
          onClick &&
            "cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="section-label">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-heading tabular-nums">
              {value}
            </p>
            {sub && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                {trend === "up" && (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                )}
                {trend === "down" && (
                  <TrendingDown className="h-3.5 w-3.5 text-danger" />
                )}
                {sub}
              </p>
            )}
          </div>
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </Comp>
    </FadeIn>
  );
}
