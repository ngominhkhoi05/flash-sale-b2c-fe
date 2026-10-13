/**
 * Hooks cho Flash Sale feature.
 *
 * Hiện tại chỉ re-export useFlashSaleSlots từ homepage hooks (đã có sẵn).
 * Tương lai có thể thêm useFlashSaleItemById, useSetReminder, ...
 */

export { useFlashSaleSlots } from "@/features/homepage/hooks";
export {
  pickActiveSlot,
  pickUpcomingSlot,
  computeSoldPercent,
  computeDiscountPercent,
  isSoldOut,
  isAlmostSoldOut,
  filterItemsByCategory,
} from "./selectors";
