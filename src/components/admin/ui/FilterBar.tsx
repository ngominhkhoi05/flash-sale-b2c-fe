"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  onReset?: () => void;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  children,
  onReset,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-lg flex flex-wrap items-center gap-3",
        className
      )}
    >
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-bright font-body-md text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all border border-transparent focus:border-primary"
          />
        </div>
      )}

      {/* Filter Children (Dropdown selects) */}
      {children}

      {/* Reset Filter Button */}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-2 text-secondary hover:text-on-surface font-label-md text-xs font-semibold transition-colors shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          <span>Đặt lại bộ lọc</span>
        </button>
      )}
    </div>
  );
}

export interface AdminSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: string;
}

export function AdminSelect({
  className,
  children,
  ...props
}: AdminSelectProps) {
  return (
    <div className="relative min-w-[150px]">
      <select
        className={cn(
          "w-full h-10 px-3 pr-8 rounded-lg bg-surface-bright font-body-sm text-xs font-medium text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-transparent focus:border-primary",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
        expand_more
      </span>
    </div>
  );
}
