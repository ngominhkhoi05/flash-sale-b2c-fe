/**
 * Cart hooks – TanStack Query wrappers (rule api-data).
 * Query keys: ["cart", ...] (sub-key per concern).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addToCart as addToCartApi,
  clearCart as clearCartApi,
  getCart as getCartApi,
  removeCartItem as removeCartItemApi,
  updateCartItem as updateCartItemApi,
} from "./api";
import type {
  AddToCartRequest,
  CartResponse,
  UpdateCartItemRequest,
} from "./types";

/** Key cho cart queries – refetch khi invalidate ["cart"]. */
export const cartKeys = {
  all: ["cart"] as const,
  detail: () => [...cartKeys.all, "detail"] as const,
};

/**
 * useCart – lấy giỏ hàng (grouped by store).
 * Disabled khi chưa auth (AuthGuard đã chặn page, nhưng check thêm để an toàn).
 */
export function useCart(enabled = true) {
  return useQuery<CartResponse>({
    queryKey: cartKeys.detail(),
    queryFn: () => getCartApi(),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * useCartCount – số dòng sản phẩm trong giỏ (badge trên header).
 * Select từ useCart để tránh gọi 2 query song song.
 */
export function useCartCount(enabled = true) {
  return useQuery<CartResponse, Error, number>({
    queryKey: cartKeys.detail(),
    queryFn: () => getCartApi(),
    enabled,
    staleTime: 30_000,
    select: (cart) => cart.totalItems,
  });
}

/**
 * useAddToCartMutation – thêm sản phẩm vào giỏ.
 * Tự invalidate cartKeys.all để UI refetch.
 */
export function useAddToCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddToCartRequest) => addToCartApi(payload),
    onSuccess: (data) => {
      qc.setQueryData(cartKeys.detail(), data);
    },
  });
}

/**
 * useUpdateCartItemMutation – cập nhật số lượng 1 dòng.
 */
export function useUpdateCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: number;
      payload: UpdateCartItemRequest;
    }) => updateCartItemApi(itemId, payload),
    onSuccess: (data) => {
      qc.setQueryData(cartKeys.detail(), data);
    },
  });
}

/**
 * useRemoveCartItemMutation – xóa 1 dòng khỏi giỏ.
 */
export function useRemoveCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => removeCartItemApi(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/**
 * useClearCartMutation – xóa toàn bộ giỏ.
 */
export function useClearCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearCartApi(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
