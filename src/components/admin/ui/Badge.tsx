import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  children: ReactNode;
  variant?:
    | "success"
    | "warning"
    | "danger"
    | "primary"
    | "secondary"
    | "neutral";
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const VARIANT_MAP = {
  success: "bg-success-soft text-on-success-soft font-semibold",
  warning: "bg-warning-soft text-on-warning-soft font-semibold",
  danger: "bg-danger-soft text-on-danger-soft font-semibold",
  primary: "bg-primary-fixed text-on-primary-fixed-variant font-semibold",
  secondary: "bg-secondary-fixed text-on-secondary-fixed font-medium",
  neutral: "bg-surface-container text-secondary font-medium",
};

const DOT_COLOR_MAP = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  primary: "bg-primary",
  secondary: "bg-secondary",
  neutral: "bg-outline",
};

export function StatusBadge({
  children,
  variant = "neutral",
  dot = false,
  pulse = false,
  className,
  size = "md",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md leading-none select-none",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        VARIANT_MAP[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            DOT_COLOR_MAP[variant],
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
