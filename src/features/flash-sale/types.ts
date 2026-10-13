/**
 * Types cho Flash Sale feature – khớp với backend DTO.
 *
 * Re-export từ homepage feature để đảm bảo cùng shape,
 * đồng thời có thể mở rộng thêm types riêng cho trang /flash-sale.
 */

export type {
  PublicFlashSaleItemResponse,
  PublicFlashSaleSlotResponse,
} from "@/features/homepage/api";
