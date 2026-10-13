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
export { getRecommendedProducts } from "./api";
export {
  useRecommendedProducts,
  useProductDetail,
  productKeys,
} from "./hooks";
export { mockProductDetail, mockProductsBySlug, mockAllProductSlugs } from "./mock";
