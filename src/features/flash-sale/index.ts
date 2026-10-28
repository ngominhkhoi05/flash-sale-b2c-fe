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
  PublicFlashSaleItemDetailResponse,
} from "./types";
export {
  mockFlashSaleSlots,
  getMockActiveSlot,
  getMockUpcomingSlot,
  getMockFlashSaleItemDetail,
} from "./mocks";
export {
  reserveFlashSale,
  isFlashSaleReserveError,
  FLASH_SALE_ERROR_MESSAGES,
} from "./api";
