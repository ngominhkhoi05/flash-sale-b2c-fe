/**
 * Products API layer – gọi backend thật.
 * Theo OpenAPI spec `http://180.93.137.28/v3/api-docs`.
 *
 * Endpoints:
 *  - GET /api/v1/products/{id}
 *  - GET /api/v1/products
 *  - GET /api/v1/products/recommended
 */
import { apiFetch } from "@/lib/api";
import type {
  ProductDetailResponse,
  ProductListParams,
  ProductSummaryResponse,
  PageResponse,
} from "./types";

/** Backend recommended response structure */
interface RecommendedProductsResponse {
  forYou: RecommendedProductResponse[];
  bestSellers: RecommendedProductResponse[];
  hotDeals: RecommendedProductResponse[];
}

interface RecommendedProductResponse {
  id: number;
  storeId: number;
  storeName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  status: string;
  createdAt: string;
}

/**
 * GET /api/v1/products/{id} – chi tiết sản phẩm.
 * Backend: 200 + ApiResponse<ProductDetailResponse>; 404 nếu không tìm thấy.
 *
 * @param id – product ID (number, từ URL hoặc slug lookup)
 */
export async function getProductDetail(id: number): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/products/${id}`);
}

/**
 * GET /api/v1/products – danh sách sản phẩm (public).
 * Dùng cho: slug→ID lookup, category listing.
 *
 * @param params – filter + pagination params
 */
export async function getProducts(
  params: ProductListParams = {}
): Promise<PageResponse<ProductSummaryResponse>> {
  const { page = 0, size = 20, ...rest } = params;

  return apiFetch<PageResponse<ProductSummaryResponse>>("/products", {
    query: {
      ...rest,
      page,
      size,
    },
  });
}

/**
 * GET /api/v1/products/recommended – sản phẩm gợi ý (3 tabs).
 * Backend trả về: { forYou, bestSellers, hotDeals }
 *
 * @param tab – "all" | "for_you" | "best_seller" | "hot_deal"
 * @param limit – số lượng mỗi tab
 */
export async function getRecommendedProducts(tab = "all", limit = 10) {
  return apiFetch<RecommendedProductsResponse>("/products/recommended", {
    query: { tab, limit },
  });
}
