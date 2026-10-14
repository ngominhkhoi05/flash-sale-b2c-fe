import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KpiTrend {
  direction: "up" | "down" | "neutral";
  percentage: number;
  comparisonText: string;
}

export interface KpiCardProps {
  title: string;
  value: ReactNode;
  iconName?: string;
  iconNode?: ReactNode;
  iconContainerClass?: string;
  trend?: KpiTrend;
  isMockSample?: boolean;
  badgeText?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  iconName = "payments",
  iconNode,
  iconContainerClass = "bg-surface-container text-primary",
  trend,
  isMockSample = true,
  badgeText,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between p-5 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow border border-outline-variant/30 select-none",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-label-sm text-xs uppercase font-semibold text-secondary tracking-wider">
              {title}
            </span>
            {isMockSample && (
              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface-container text-secondary leading-none">
                Dữ liệu mẫu
              </span>
            )}
            {badgeText && (
              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary-fixed text-on-primary-fixed-variant leading-none">
                {badgeText}
              </span>
            )}
          </div>
          <span className="font-display-sm text-2xl font-bold text-on-surface mt-1 font-data-tabular tabular-nums truncate">
            {value}
          </span>
        </div>

        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs",
            iconContainerClass
          )}
        >
          {iconNode ? (
            iconNode
          ) : (
            <span className="material-symbols-outlined text-[22px]">
              {iconName}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Trend */}
      {trend && (
        <div className="flex items-center gap-1.5 mt-4 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-label-md font-bold leading-none font-data-tabular",
              trend.direction === "up"
                ? "bg-primary-fixed text-on-primary-fixed-variant"
                : trend.direction === "down"
                  ? "bg-danger-soft text-on-danger-soft"
                  : "bg-surface-container text-secondary"
            )}
          >
            {trend.direction === "up" && "▲"}
            {trend.direction === "down" && "▼"}
            {trend.direction === "neutral" && "•"} {trend.percentage}%
          </span>
          <span className="font-body-sm text-secondary truncate">
            {trend.comparisonText}
          </span>
        </div>
      )}
    </div>
  );
}
