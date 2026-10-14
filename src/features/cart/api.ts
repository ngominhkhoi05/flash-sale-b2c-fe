/**
 * Cart API layer.
 *
 * Backend endpoints (from http://180.93.137.28/swagger-ui):
 * - GET    /api/v1/cart                    → Lấy giỏ hàng
 * - POST   /api/v1/cart/items             → Thêm sản phẩm vào giỏ
 * - PUT    /api/v1/cart/items/{itemId}   → Cập nhật số lượng
 * - DELETE /api/v1/cart/items/{itemId}    → Xóa 1 sản phẩm
 * - DELETE /api/v1/cart                   → Xóa toàn bộ giỏ
 *
 * Convention:
 * - Pure function, throw ApiError
 * - Trả về DTO khớp với backend
 * - Test trong api.test.ts (mock apiFetch bằng vi.fn())
 */

import { apiFetch } from "@/lib/api";

// ─── Backend Response Types (khớp Swagger 2026-10-14) ──────────────────────────

/** CartItemResponse từ backend */
export interface BackendCartItem {
  id: number;
  variantId: number;
  sku: string;
  storeId: number;
  storeName: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  itemSubtotal: number;
}

/** CartStoreGroupResponse từ backend — 4 fields đúng */
export interface BackendCartStoreGroup {
  storeId: number;
  storeName: string;
  items: BackendCartItem[];
  storeSubtotal: number;
}

/** CartResponse từ backend — 5 fields đúng */
export interface BackendCartResponse {
  id: number;
  userId: number;
  storeGroups: BackendCartStoreGroup[];
  totalItems: number;
  grandTotal: number;
}

// ─── Request Types ────────────────────────────────────────────────────────────

/** Request body cho POST /api/v1/cart/items */
export interface AddToCartRequest {
  variantId: number;
  quantity: number;
}

/** Request body cho PUT /api/v1/cart/items/{itemId} */
export interface UpdateCartItemRequest {
  quantity: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/cart
 *
 * Lấy danh sách item trong giỏ hàng của user hiện tại.
 * Giỏ hàng được gom nhóm theo store.
 *
 * Error: 401 nếu chưa đăng nhập.
 */
export async function getCart(): Promise<BackendCartResponse> {
  return apiFetch<BackendCartResponse>("/api/v1/cart");
}

/**
 * POST /api/v1/cart/items
 *
 * Thêm sản phẩm vào giỏ hàng.
 * Backend trả về ApiResponse<CartResponse> (full cart sau khi thêm).
 *
 * Request:
 * - variantId: ID của biến thể sản phẩm
 * - quantity: số lượng muốn thêm (> 0)
 *
 * Error codes:
 * - 400 CART_400_1 (INSUFFICIENT_STOCK) → Số lượng tồn kho không đủ
 * - 400 CART_400_2 (INVALID_QUANTITY) → Số lượng phải lớn hơn 0
 */
export async function addToCart(
  request: AddToCartRequest
): Promise<BackendCartResponse> {
  return apiFetch<BackendCartResponse>("/api/v1/cart/items", {
    method: "POST",
    json: request,
  });
}

/**
 * PUT /api/v1/cart/items/{itemId}
 *
 * Cập nhật số lượng sản phẩm trong giỏ hàng.
 * Backend trả về ApiResponse<CartResponse> (full cart sau khi cập nhật).
 *
 * Request:
 * - itemId: ID của cart item cần cập nhật
 * - quantity: số lượng mới (> 0)
 *
 * Error codes:
 * - 400 CART_400_2 (INVALID_QUANTITY) → Số lượng phải lớn hơn 0
 * - 404 CART_ITEM_404 → Không tìm thấy sản phẩm trong giỏ hàng
 * - 403 CART_403 → Không có quyền thao tác trên mục này
 */
export async function updateCartItem(
  itemId: number,
  request: UpdateCartItemRequest
): Promise<BackendCartResponse> {
  return apiFetch<BackendCartResponse>(
    `/api/v1/cart/items/${itemId}`,
    {
      method: "PUT",
      json: request,
    }
  );
}

/**
 * DELETE /api/v1/cart/items/{itemId}
 *
 * Xóa một sản phẩm khỏi giỏ hàng.
 * Backend trả về ApiResponse<CartResponse> (full cart sau khi xóa).
 *
 * Error codes:
 * - 404 CART_ITEM_404 → Không tìm thấy sản phẩm trong giỏ hàng
 * - 403 CART_403 → Không có quyền thao tác trên mục này
 */
export async function removeCartItem(
  itemId: number
): Promise<BackendCartResponse> {
  return apiFetch<BackendCartResponse>(
    `/api/v1/cart/items/${itemId}`,
    { method: "DELETE" }
  );
}

/**
 * DELETE /api/v1/cart
 *
 * Xóa toàn bộ giỏ hàng.
 * Backend trả về 204 No Content.
 */
export async function clearCart(): Promise<void> {
  return apiFetch<void>("/api/v1/cart", {
    method: "DELETE",
  });
}
