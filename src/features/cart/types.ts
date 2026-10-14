/**
 * Cart feature – types (rule features-migration).
 * Giỏ hàng của user đã đăng nhập.
 *
 * Source: src/features/cart/api.ts (BackendCartResponse, BackendCartItem).
 *
 * Types này align với backend DTO từ /api/v1/cart endpoint.
 */

import type {
  BackendCartResponse,
  BackendCartItem,
  BackendCartStoreGroup,
} from "./api";

// Re-export backend types for external usage
export type {
  BackendCartResponse,
  BackendCartItem,
  BackendCartStoreGroup,
};

// ─── Frontend Domain Types ─────────────────────────────────────────────────────

/** Frontend cart item (adapted từ BackendCartItem).
 * BE CartItemResponse KHÔNG có stockQuantity, productId — FE tự tính inStock.
 */
export interface CartItem {
  id: string;
  productName: string;
  variantId: number;
  variantLabel: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  itemSubtotal: number;
  storeId: number;
  storeName: string;
  inStock: boolean;
  /** NOTE: stockQuantity, productId không có trong BE response — tính từ API khác */
  stockQuantity?: number;
  productId?: string;
}

/** Cart store group (gom nhóm theo shop) */
export interface CartStoreGroup {
  storeId: number;
  storeName: string;
  items: CartItem[];
  storeSubtotal: number;
}

/** Cart summary — NOTE: subtotal/shippingFee không có riêng trong BE CartResponse
 *  FE tính từ storeGroups hoặc từ API khác. */
export interface CartSummary {
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  storeGroups: CartStoreGroup[];
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/** Adapt BackendCartItem → CartItem (frontend domain) */
export function adaptCartItem(item: BackendCartItem): CartItem {
  return {
    id: String(item.id),
    productName: item.productName,
    variantId: item.variantId,
    variantLabel: item.variantName,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    unitPrice: item.price,
    itemSubtotal: item.itemSubtotal,
    storeId: item.storeId,
    storeName: item.storeName,
    inStock: true, // TODO: resolve từ product stock API
  };
}

/** Adapt BackendCartStoreGroup → CartStoreGroup */
export function adaptCartStoreGroup(
  group: BackendCartStoreGroup
): CartStoreGroup {
  return {
    storeId: group.storeId,
    storeName: group.storeName,
    items: group.items.map(adaptCartItem),
    storeSubtotal: group.storeSubtotal,
  };
}

/** Adapt BackendCartResponse → CartSummary */
export function adaptCartResponse(
  cart: BackendCartResponse
): CartSummary {
  const storeGroups = cart.storeGroups.map(adaptCartStoreGroup);
  const subtotal = storeGroups.reduce(
    (sum, g) => sum + g.storeSubtotal,
    0
  );
  return {
    totalItems: cart.totalItems,
    subtotal,
    shippingFee: 0, // FE tính từ shipping API
    grandTotal: cart.grandTotal,
    storeGroups,
  };
}
