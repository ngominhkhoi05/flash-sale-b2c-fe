/**
 * Cart feature public API (rule features-migration).
 */

export {
  adaptCartItem,
  adaptCartStoreGroup,
  adaptCartResponse,
} from "./types";
export type {
  CartItem,
  CartSummary,
  CartStoreGroup,
  BackendCartItem,
  BackendCartResponse,
  BackendCartStoreGroup,
} from "./types";

export {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "./api";

export {
  useCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useCartCount,
  cartKeys,
} from "./hooks";

export type { AddToCartRequest, UpdateCartItemRequest } from "./api";
