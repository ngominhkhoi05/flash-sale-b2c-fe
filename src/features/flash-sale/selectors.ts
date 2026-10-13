/**
 * Pure selectors (helper functions) cho Flash Sale feature.
 *
 * Tách logic ra để test được + tái sử dụng giữa hooks + components.
 */

import type { PublicFlashSaleItemResponse, PublicFlashSaleSlotResponse } from "./types";

/** Lấy slot ACTIVE đầu tiên (ưu tiên ACTIVE > UPCOMING > đầu tiên). */
export function pickActiveSlot(
  slots: PublicFlashSaleSlotResponse[] | undefined,
): PublicFlashSaleSlotResponse | undefined {
  if (!slots || slots.length === 0) return undefined;
  return slots.find((s) => s.status === "ACTIVE");
}

/** Lấy slot UPCOMING đầu tiên. */
export function pickUpcomingSlot(
  slots: PublicFlashSaleSlotResponse[] | undefined,
): PublicFlashSaleSlotResponse | undefined {
  if (!slots || slots.length === 0) return undefined;
  return slots.find((s) => s.status === "UPCOMING");
}

/** Tính % đã bán (0-100), an toàn khi allocatedStock=0. */
export function computeSoldPercent(item: PublicFlashSaleItemResponse): number {
  if (item.allocatedStock <= 0) return 0;
  const sold = item.allocatedStock - item.availableStock;
  return Math.round((sold / item.allocatedStock) * 100);
}

/** Tính % giảm giá (0-100), an toàn khi originalPrice=0. */
export function computeDiscountPercent(item: PublicFlashSaleItemResponse): number {
  if (item.originalPrice <= 0) return 0;
  if (item.flashSalePrice >= item.originalPrice) return 0;
  return Math.round(
    ((item.originalPrice - item.flashSalePrice) / item.originalPrice) * 100,
  );
}

/** Item đã bán hết (availableStock=0). */
export function isSoldOut(item: PublicFlashSaleItemResponse): boolean {
  return item.availableStock <= 0;
}

/** Item sắp cháy hàng (>90% sold, còn stock). */
export function isAlmostSoldOut(item: PublicFlashSaleItemResponse): boolean {
  if (isSoldOut(item)) return false;
  return computeSoldPercent(item) > 90;
}

/** Filter items theo categoryId. Hiện tại BE chưa trả categoryId → no-op. */
export function filterItemsByCategory(
  items: PublicFlashSaleItemResponse[],
  _categoryId: number | null,
): PublicFlashSaleItemResponse[] {
  if (_categoryId == null) return items;
  // TODO(api): khi BE trả categoryId, lọc theo. Hiện tại no-op.
  return items;
}
