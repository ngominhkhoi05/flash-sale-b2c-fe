/**
 * Cart API – mock hiện tại, sẽ thay bằng apiFetch() khi backend cung cấp
 * (xem handoff docs/handoffs/2026-10-10-frontend-storefront-homepage-api-requests.md).
 *
 * Convention (rule api-data):
 *  - Pure function, throw ApiError
 *  - Trả về DTO khớp với `types.ts`
 *  - Test trong api.test.ts (mock apiFetch bằng vi.fn())
 */
import { apiFetch } from "@/lib/api";
import type { CartItem, CartSummary } from "./types";

/**
 * GET /api/v1/cart – lấy danh sách item trong giỏ hàng của user hiện tại.
 * Backend: 200 + CartItem[]; 401 nếu chưa đăng nhập.
 */
export async function getCartItems(): Promise<CartItem[]> {
  return apiFetch<CartItem[]>("/cart");
}

/**
 * GET /api/v1/cart/summary – tổng hợp (subtotal, shipping, total).
 * Backend: 200 + CartSummary; 401 nếu chưa đăng nhập.
 */
export async function getCartSummary(): Promise<CartSummary> {
  return apiFetch<CartSummary>("/cart/summary");
}
