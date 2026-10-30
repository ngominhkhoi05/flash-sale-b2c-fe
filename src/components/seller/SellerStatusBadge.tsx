import React from "react";
import { cn } from "@/lib/utils";

export type SellerBadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface SellerStatusBadgeProps {
  status: string;
  label?: string;
  variant?: SellerBadgeVariant;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: SellerBadgeVariant }> = {
  // Product Statuses
  ACTIVE: { label: "Đang bán", variant: "success" },
  INACTIVE: { label: "Đã ẩn", variant: "neutral" },
  OUT_OF_STOCK: { label: "Hết hàng", variant: "warning" },
  BANNED: { label: "Vi phạm / Khóa", variant: "danger" },

  // Order Statuses
  PENDING_PAYMENT: { label: "Chờ thanh toán", variant: "warning" },
  PENDING_CONFIRMATION: { label: "Chờ xác nhận", variant: "warning" },
  CONFIRMED: { label: "Đã xác nhận", variant: "info" },
  PROCESSING: { label: "Chờ lấy hàng", variant: "info" },
  SHIPPING: { label: "Đang giao", variant: "info" },
  DELIVERED: { label: "Đã giao hàng", variant: "success" },
  COMPLETED: { label: "Hoàn tất", variant: "success" },
  CANCELLED: { label: "Đã hủy", variant: "danger" },
  CANCELLED_TIMEOUT: { label: "Hết hạn thanh toán", variant: "danger" },
  CANCELLED_USER: { label: "Người mua đã hủy", variant: "danger" },
  REFUNDED: { label: "Đã hoàn tiền", variant: "neutral" },

  // Flash Sale Registration Item Statuses
  PENDING: { label: "Chờ duyệt", variant: "warning" },
  APPROVED: { label: "Đã duyệt", variant: "success" },
  REJECTED: { label: "Từ chối", variant: "danger" },

  // Voucher Statuses
  EXPIRED: { label: "Hết hạn", variant: "neutral" },
  UPCOMING: { label: "Sắp diễn ra", variant: "info" },
};

export function SellerStatusBadge({
  status,
  label,
  variant,
  className,
}: SellerStatusBadgeProps) {
  const mapped = STATUS_MAP[status.toUpperCase()] || {
    label: status,
    variant: "neutral" as SellerBadgeVariant,
  };

  const finalLabel = label || mapped.label;
  const finalVariant = variant || mapped.variant;

  const variantClasses: Record<SellerBadgeVariant, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap",
        variantClasses[finalVariant],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {finalLabel}
    </span>
  );
}
