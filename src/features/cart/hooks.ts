/**
 * Cart hooks – TanStack Query wrappers (rule api-data).
 * Query keys: ["cart", ...] (sub-key per concern).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type AddToCartRequest,
  type BackendCartResponse,
} from "./api";

/** Key cho list cart items – refetch khi invalidate ["cart"]. */
export const cartKeys = {
  all: ["cart"] as const,
  items: () => [...cartKeys.all, "items"] as const,
  summary: () => [...cartKeys.all, "summary"] as const,
};

/**
 * useCart – lấy toàn bộ giỏ hàng.
 * Trả về BackendCartResponse với storeGroups.
 */
export function useCart(enabled = true) {
  return useQuery<BackendCartResponse>({
    queryKey: cartKeys.items(),
    queryFn: () => getCart(),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * useAddToCart – mutation thêm sản phẩm vào giỏ.
 * Backend trả về BackendCartResponse (full cart sau khi thêm).
 */
export function useAddToCart(options?: {
  onSuccess?: (data: BackendCartResponse) => void;
  onError?: (error: unknown, variables: AddToCartRequest) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddToCartRequest) => addToCart(request),
    onSuccess: (data) => {
      // Invalidate cart queries để refresh
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      options?.onSuccess?.(data);
    },
    onError: (error, variables) => {
      console.error("[cart.useAddToCart]", { error, variables });
      options?.onError?.(error, variables);
    },
  });
}

/**
 * useUpdateCartItem – mutation cập nhật số lượng.
 * Backend trả về BackendCartResponse (full cart sau khi cập nhật).
 */
export function useUpdateCartItem(options?: {
  onSuccess?: (data: BackendCartResponse) => void;
  onError?: (
    error: unknown,
    variables: { itemId: number; quantity: number }
  ) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItem(itemId, { quantity }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      options?.onSuccess?.(data);
    },
    onError: (error, variables) => {
      console.error("[cart.useUpdateCartItem]", { error, variables });
      options?.onError?.(error, variables);
    },
  });
}

/**
 * useRemoveCartItem – mutation xóa 1 sản phẩm khỏi giỏ.
 * Backend trả về BackendCartResponse (full cart sau khi xóa).
 */
export function useRemoveCartItem(options?: {
  onSuccess?: (data: BackendCartResponse) => void;
  onError?: (error: unknown, variables: { itemId: number }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId }: { itemId: number }) => removeCartItem(itemId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      options?.onSuccess?.(data);
    },
    onError: (error, variables) => {
      console.error("[cart.useRemoveCartItem]", { error, variables });
      options?.onError?.(error, variables);
    },
  });
}

/**
 * useClearCart – mutation xóa toàn bộ giỏ hàng.
 * Backend trả về 204 No Content.
 */
export function useClearCart(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("[cart.useClearCart]", { error });
      options?.onError?.(error);
    },
  });
}

/**
 * useCartCount – số lượng item (badge trên header).
 * Select từ useCart để tránh gọi 2 query song song.
 * Dùng `select` để trả về `number` thay vì `BackendCartResponse | undefined` –
 * TanStack Query vẫn gọi queryFn 1 lần nhưng `data` luôn là number.
 */
export function useCartCount(enabled = true) {
  return useQuery<BackendCartResponse, Error, number>({
    queryKey: cartKeys.items(),
    queryFn: () => getCart(),
    enabled,
    staleTime: 30_000,
    select: (cart) => cart.totalItems,
  });
}
