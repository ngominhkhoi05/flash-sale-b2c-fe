/**
 * Cart feature – types (rule features-migration).
 * Khớp với OpenAPI spec `http://180.93.137.28/v3/api-docs`:
 *  - CartResponse
 *  - CartStoreGroupResponse
 *  - CartItemResponse
 *
 * Backend Spring Boot tự động gom nhóm item theo store, trả về
 * `storeGroups[]` thay vì flat list — UI chỉ cần render.
 */

/** Một dòng sản phẩm trong giỏ. */
export interface CartItemResponse {
  id: number;
  variantId: number;
  sku: string;
  productName: string;
  variantName: string;
  imageUrl: string;
  /** Đơn giá hiện tại (BigDecimal từ backend, FE nhận number). */
  price: number;
  stockQuantity: number;
  quantity: number;
  /** Subtotal của dòng = price * quantity. */
  itemSubtotal: number;
  storeId: number;
  storeName: string;
}

/** Nhóm sản phẩm theo cửa hàng trong giỏ. */
export interface CartStoreGroup {
  storeId: number;
  storeName: string;
  items: CartItemResponse[];
  /** Subtotal của cả nhóm = sum(itemSubtotal). */
  storeSubtotal: number;
}

/** Response tổng của `GET /api/v1/cart`. */
export interface CartResponse {
  id: number;
  userId: number;
  storeGroups: CartStoreGroup[];
  /** Tổng số lượng dòng (count items, không tính quantity). */
  totalItems: number;
  /** Tổng tiền cả giỏ. */
  grandTotal: number;
}

/** Request body cho `POST /api/v1/cart/items`. */
export interface AddToCartRequest {
  variantId: number;
  quantity: number;
}

/** Request body cho `PUT /api/v1/cart/items/{itemId}`. */
export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Helper: flatten storeGroups thành CartItemResponse[].
 * Dùng khi cần select nhiều / filter / count.
 */
export function flattenCartItems(cart: CartResponse | undefined): CartItemResponse[] {
  if (!cart?.storeGroups) return [];
  return cart.storeGroups.flatMap((group) => group.items);
}
