import Decimal from "decimal.js";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Format helpers – rule §6.
 * Tiền: BigDecimal (rule: KHÔNG float) → "1.290.000₫"
 * Số lớn: "1,2k", "12,3k", "1,28 tỷ₫"
 * Ngày giờ: vi-VN locale.
 */

const VND_SUFFIX = "₫";

/** Trả về Decimal từ string | number | Decimal (server trả về BigDecimal → string). */
export function toDecimal(value: string | number | Decimal): Decimal {
  return value instanceof Decimal ? value : new Decimal(value ?? 0);
}

/** Format VND: 1.290.000₫ */
export function formatVND(value: string | number | Decimal): string {
  const n = toDecimal(value);
  const grouped = n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped}${VND_SUFFIX}`;
}

/** Rút gọn số lớn cho dashboard / card. Locale vi: "1,2k", "12,3k", "1,28 tỷ₫" */
export function formatShortNumber(value: string | number | Decimal): string {
  const n = Number(toDecimal(value).toString());
  const fmt = (s: string) => s.replace(".", ",");
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) return `${fmt((n / 1_000).toFixed(1).replace(/\.0$/, ""))}k`;
  if (n < 1_000_000_000) return `${fmt((n / 1_000_000).toFixed(1).replace(/\.0$/, ""))}k`;
  return `${fmt((n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, ""))} tỷ${VND_SUFFIX}`;
}

/** "14:00 – 01/10/2026" */
export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  return `${format(d, "HH:mm", { locale: vi })} – ${format(d, "dd/MM/yyyy", { locale: vi })}`;
}

/** "5 phút trước" */
export function formatRelative(iso: string | Date): string {
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
}

/** "01/10/2026" */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  return format(d, "dd/MM/yyyy", { locale: vi });
}

/**
 * Format VND ngắn gọn cho card / badge: "1tr", "1,5tr", "12,3k", "500".
 * Trả về chuỗi KHÔNG kèm ký hiệu "₫" (compact hơn formatVND).
 * - < 1.000 → raw number
 * - 1.000 – 999.999 → "Xk" / "X,Yk"
 * - ≥ 1.000.000 → "Xtr" / "X,Ytr"
 */
export function formatVNDCompact(value: string | number | Decimal): string {
  const n = Number(toDecimal(value).toString());
  const fmt = (s: string) => s.replace(".", ",");
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) {
    const k = n / 1_000;
    // floor to 1 decimal to avoid edge-case overflow to 1000.0 when value is near upper bound
    const flooredK = Math.floor(k * 10) / 10;
    const fixed = flooredK.toFixed(1);
    const stripped = fixed.endsWith(".0") ? `${Math.floor(flooredK)}` : fixed;
    return `${fmt(stripped)}k`;
  }
  const m = n / 1_000_000;
  const fixed = m.toFixed(2);
  const stripped = fixed.replace(/\.?0+$/, "");
  return `${fmt(stripped)}tr`;
}
