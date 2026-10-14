/**
 * Products API – gợi ý cá nhân hoá cho user.
 * Tương lai gắn endpoint thật (xem handoff mục 2.5).
 */
import { apiFetch } from "@/lib/api";
import type { RecommendedProduct, ProductDetail } from "./types";

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

/**
 * GET /api/v1/products/slug/{slug} – chi tiết sản phẩm theo slug SEO.
 * Chỉ trả về product ACTIVE của store APPROVED (xem Swagger).
 * - 200 → ProductDetail
 * - 404 → throw ApiError(code=NOT_FOUND, status=404) để component handle.
 */
export async function fetchProductDetailBySlug(slug: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(
    `/api/v1/products/slug/${encodeURIComponent(slug)}`,
  );
}

/**
 * GET /api/v1/products/{id} – chi tiết sản phẩm theo numeric id.
 * Dùng để resolve id → slug (page detail route sẽ redirect sang slug SEO).
 * - 200 → ProductDetail
 * - 404 → throw ApiError.
 */
export async function fetchProductDetailById(id: number): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/api/v1/products/${id}`);
}
