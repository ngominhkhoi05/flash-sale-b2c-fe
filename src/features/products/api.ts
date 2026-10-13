/**
 * Products API – gợi ý cá nhân hoá cho user.
 * Tương lai gắn endpoint thật (xem handoff mục 2.5).
 */
import { apiFetch } from "@/lib/api";
import type { RecommendedProduct } from "./types";

/**
 * GET /api/v1/products/recommended?size=20 – sản phẩm gợi ý.
 * - Có thể trả về sản phẩm phổ biến nếu user chưa login (server tự quyết).
 * - 200 + RecommendedProduct[]; 401 nếu API yêu cầu auth (hiện tại public).
 */
export async function getRecommendedProducts(size = 20): Promise<RecommendedProduct[]> {
  return apiFetch<RecommendedProduct[]>("/products/recommended", {
    query: { size },
  });
}
