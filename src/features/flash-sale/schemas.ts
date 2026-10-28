/**
 * Zod schemas cho Flash Sale data layer.
 *
 * Validate response shape từ backend (và mock data).
 * Rule §7: types khớp DTO backend, không dùng any.
 *
 * Source: src/features/homepage/api.ts (PublicFlashSaleSlotResponse).
 */

import { z } from "zod";

/** Enum status cho slot Flash Sale. */
export const slotStatusSchema = z.enum(["UPCOMING", "ACTIVE", "ENDED"]);

/** Enum status cho 1 item Flash Sale. */
export const flashSaleItemStatusSchema = z.enum([
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "ENDED",
]);

/** Schema cho 1 sản phẩm trong slot Flash Sale. */
export const publicFlashSaleItemResponseSchema = z.object({
  id: z.number().int().positive(),
  slotId: z.number().int().positive(),
  productId: z.number().int().positive().optional(),
  variantId: z.number().int().positive(),
  sku: z.string().min(1),
  variantName: z.string().min(1),
  attributes: z.record(z.string()).nullable().optional(),
  productName: z.string().min(1),
  imageUrl: z.string().url(),
  originalPrice: z.number().nonnegative(),
  flashSalePrice: z.number().nonnegative(),
  allocatedStock: z.number().int().nonnegative(),
  availableStock: z.number().int().nonnegative(),
  userPurchaseLimit: z.number().int().nonnegative(),
  status: flashSaleItemStatusSchema,
});

/** Schema cho 1 slot Flash Sale (1 khung giờ). */
export const publicFlashSaleSlotResponseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reservationTtlSeconds: z.number().int().nonnegative(),
  status: slotStatusSchema,
  items: z.array(publicFlashSaleItemResponseSchema),
});

/** Schema cho danh sách slot. */
export const publicFlashSaleSlotsResponseSchema = z.array(
  publicFlashSaleSlotResponseSchema,
);
