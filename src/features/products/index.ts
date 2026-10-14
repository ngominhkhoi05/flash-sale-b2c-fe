// Products feature public API
export type {
  RecommendedProduct,
  ProductDetail,
  ProductImage,
  ProductVariant,
  Review,
  ReviewReply,
  FlashSaleInfo,
  ProductSpecs,
  SizeChartRow,
  ProductFeature,
  StoreProfile,
  ShopVoucher,
  ShippingInfo,
  CommitmentBadge,
  ProductVariantMode,
  TierVariationConfig,
} from "./types";
export { getRecommendedProducts, fetchProductDetailById, fetchProductDetailBySlug } from "./api";
export {
  useRecommendedProducts,
  useProductDetail,
  useProductDetailBySlug,
  useProductDetailById,
  productKeys,
} from "./hooks";
export { mockProductDetail, mockProductsBySlug, mockProductIdToSlug, mockAllProductSlugs } from "./mock";
