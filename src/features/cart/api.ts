/**
 * Cart API layer – kết nối backend thật.
 * Theo OpenAPI spec `http://180.93.137.28/v3/api-docs`:
 *  - GET /api/v1/cart
 *  - DELETE /api/v1/cart
 *  - POST /api/v1/cart/items
 *  - PUT /api/v1/cart/items/{itemId}
 *  - DELETE /api/v1/cart/items/{itemId}
 *
 * Convention (rule api-data):
 *  - Pure function, throw ApiError
 *  - Trả về DTO khớp với `types.ts`
 */
import { apiFetch } from "@/lib/api";
import type {
  CartResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
} from "./types";

/**
 * GET /api/v1/cart – lấy giỏ hàng cá nhân.
 * Backend: 200 + CartResponse; 401 nếu chưa đăng nhập.
 */
export async function getCart(): Promise<CartResponse> {
  return apiFetch<CartResponse>("/cart");
}

/**
 * DELETE /api/v1/cart – xóa toàn bộ giỏ hàng.
 */
export async function clearCart(): Promise<void> {
  return apiFetch<void>("/cart", { method: "DELETE" });
}

/**
 * POST /api/v1/cart/items – thêm sản phẩm vào giỏ.
 */
export async function addToCart(
  payload: AddToCartRequest
): Promise<CartResponse> {
  return apiFetch<CartResponse>("/cart/items", {
    method: "POST",
    json: payload,
  });
}

/**
 * PUT /api/v1/cart/items/{itemId} – cập nhật số lượng.
 */
export async function updateCartItem(
  itemId: number,
  payload: UpdateCartItemRequest
): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/cart/items/${itemId}`, {
    method: "PUT",
    json: payload,
  });
}

/**
 * DELETE /api/v1/cart/items/{itemId} – xóa 1 sản phẩm khỏi giỏ.
 */
export async function removeCartItem(itemId: number): Promise<void> {
  return apiFetch<void>(`/cart/items/${itemId}`, { method: "DELETE" });
}
