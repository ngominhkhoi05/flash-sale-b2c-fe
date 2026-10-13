/**
 * Cart hooks – TanStack Query wrappers (rule api-data).
 * Query keys: ["cart", ...] (sub-key per concern).
 */
import { useQuery } from "@tanstack/react-query";
import { getCartItems, getCartSummary } from "./api";
import type { CartItem, CartSummary } from "./types";

/** Key cho list cart items – refetch khi invalidate ["cart"]. */
export const cartKeys = {
  all: ["cart"] as const,
  items: () => [...cartKeys.all, "items"] as const,
  summary: () => [...cartKeys.all, "summary"] as const,
};

/**
 * useCartItems – danh sách item trong giỏ.
 * Disabled khi chưa auth (AuthGuard đã chặn page, nhưng check thêm để an toàn).
 */
export function useCartItems(enabled = true) {
  return useQuery<CartItem[]>({
    queryKey: cartKeys.items(),
    queryFn: () => getCartItems(),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * useCartSummary – tổng hợp giỏ hàng.
 */
export function useCartSummary(enabled = true) {
  return useQuery<CartSummary>({
    queryKey: cartKeys.summary(),
    queryFn: () => getCartSummary(),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * useCartCount – số lượng item (badge trên header).
 * Select từ useCartSummary để tránh gọi 2 query song song.
 * Dùng `select` để trả về `number` thay vì `CartSummary | undefined` –
 * TanStack Query sẽ vẫn gọi queryFn 1 lần nhưng `data` luôn là number.
 */
export function useCartCount(enabled = true) {
  return useQuery<CartSummary, Error, number>({
    queryKey: cartKeys.summary(),
    queryFn: () => getCartSummary(),
    enabled,
    staleTime: 30_000,
    select: (summary) => summary.totalItems,
  });
}
