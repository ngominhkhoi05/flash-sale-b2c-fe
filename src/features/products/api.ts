/**
 * Products API – suggestions cho user.
 */
import { apiFetch } from "@/lib/api";
import type { RecommendedProduct, ProductDetail } from "./types";

/**
 * GET /api/v1/products/recommended?size=20.
 * 200 + RecommendedProduct[]; 401 nếu API yêu cầu auth.
 */
export async function getRecommendedProducts(size = 20): Promise<RecommendedProduct[]> {
  return apiFetch<RecommendedProduct[]>("/products/recommended", {
    query: { size },
  });
}

/**
 * Map lowercase keys (size, color) BE runtime tra trong variant.attributes
 * sang uppercase keys (Size, Color) de khop voi tierVariationConfigs[].name.
 * Idempotent: neu key da uppercase thi giu nguyen. Giu nguyen moi key khac.
 *
 * Xem: docs/handoffs/2026-10-18-be-tier-options-mismatch.md
 */
const ATTR_KEY_ALIASES: Record<string, string> = {
  size: "Size",
  color: "Color",
};

function normalizeVariantAttributes(
  attrs: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    const normalizedKey = ATTR_KEY_ALIASES[key.toLowerCase()] ?? key;
    out[normalizedKey] = value;
  }
  return out;
}

function normalizeProductVariants(product: ProductDetail): ProductDetail {
  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      attributes: normalizeVariantAttributes(v.attributes),
    })),
  };
}

/**
 * GET /api/v1/products/slug/{slug}.
 * 200 -> ProductDetail; 404 -> throw ApiError.
 */
export async function fetchProductDetailBySlug(slug: string): Promise<ProductDetail> {
  const product = await apiFetch<ProductDetail>(
    `/api/v1/products/slug/${encodeURIComponent(slug)}`,
  );
  return normalizeProductVariants(product);
}

/**
 * GET /api/v1/products/{id}.
 * 200 -> ProductDetail; 404 -> throw ApiError.
 */
export async function fetchProductDetailById(id: number): Promise<ProductDetail> {
  const product = await apiFetch<ProductDetail>(`/api/v1/products/${id}`);
  return normalizeProductVariants(product);
}
