import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Gộp className theo quy ước shadcn (clsx + tailwind-merge).
 * Dùng cho mọi component (rule §11).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam Đồng (VND).
 */
export function formatVND(value: number): string {
  if (typeof value !== "number" || isNaN(value)) return "0₫";
  return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + "₫";
}
