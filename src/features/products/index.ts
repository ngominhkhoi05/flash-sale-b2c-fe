// Products feature public API
export type {
  RecommendedProduct,
  RelatedProductSummary,
  DescriptionRichDto,
  ProductSpecsDto,
  SizeChartDto,
  SizeChartDimensionDto,
  ActiveFlashSaleDto,
  RatingDistributionDto,
  ProductDetail,
  ProductImage,
  ProductVariant,
  Review,
  ReviewReply,
  StoreProfile,
  ShopVoucher,
  ShippingInfo,
  CommitmentBadge,
  BackendProductCommitment,
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