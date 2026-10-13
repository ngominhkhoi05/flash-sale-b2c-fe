/**
 * Public API cho Flash Sale feature.
 */

export {
  useFlashSaleSlots,
  pickActiveSlot,
  pickUpcomingSlot,
  computeSoldPercent,
  computeDiscountPercent,
  isSoldOut,
  isAlmostSoldOut,
  filterItemsByCategory,
} from "./hooks";
export type {
  PublicFlashSaleItemResponse,
  PublicFlashSaleSlotResponse,
} from "./types";
export {
  mockFlashSaleSlots,
  getMockActiveSlot,
  getMockUpcomingSlot,
} from "./mocks";
