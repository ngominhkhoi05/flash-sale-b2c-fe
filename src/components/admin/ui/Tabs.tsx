"use client";

import { cn } from "@/lib/utils";

export interface AdminTabItem<T extends string = string> {
  key: T;
  label: string;
  count?: number | string;
  badgeVariant?: "primary" | "warning" | "danger" | "neutral";
  icon?: string;
}

export interface AdminTabsProps<T extends string = string> {
  items: AdminTabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  className?: string;
}

export function AdminTabs<T extends string = string>({
  items,
  activeKey,
  onChange,
  className,
}: AdminTabsProps<T>) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 select-none",
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "px-3.5 py-2 rounded-lg font-label-md text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer",
              isActive
                ? "bg-primary text-on-primary shadow-sm"
                : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
            )}
          >
            {tab.icon && (
              <span className="material-symbols-outlined text-[16px]">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] leading-none font-bold",
                  isActive
                    ? "bg-white/20 text-on-primary"
                    : tab.badgeVariant === "danger"
                      ? "bg-danger-soft text-on-danger-soft"
                      : tab.badgeVariant === "warning"
                        ? "bg-warning-soft text-on-warning-soft"
                        : "bg-surface-container text-secondary"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
