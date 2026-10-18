/**
 * Mock data cho Product Detail page.
 *
 * Updated 2026-10-18 — align với BE `ProductDetailResponse` runtime shape:
 *   - `descriptionRich`: {intro, highlights[], paragraphs[]}
 *   - `specs`: {origin, weight, material, warranty}
 *   - `features`: string[]
 *   - `sizeChart`: {large: {...}, standard: {...}}
 *   - `flashSales`: ActiveFlashSaleDto[] (array, BE đặt product có thể
 *     tham gia nhiều slot)
 *   - `relatedSameStore`/`relatedBestSellers`: RelatedProductSummary[]
 *   - `minPrice`/`maxPrice`: number | null
 *   - `storeProfile.joinedAt`: đã bỏ (BE không trả)
 *
 * Khi BE ready (đã chạy ổn định), có thể xoá mock và gọi API thật 1:1.
 */

import type {
  ProductDetail,
  ProductImage,
  ProductVariant,
  Review,
  StoreProfile,
  ShopVoucher,
  ShippingInfo,
  BackendProductCommitment,
  TierVariationConfig,
  RelatedProductSummary,
  ActiveFlashSaleDto,
  ProductSpecsDto,
  SizeChartDto,
  DescriptionRichDto,
  RatingDistributionDto,
} from "./types";

// ── Images (5 ảnh Stitch) ──────────────────────────────────────────────────
const PRODUCT_IMAGES: ProductImage[] = [
  {
    id: 1,
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-_Su8_GbUYnSmNtTEuGuv2FFV1aGVUJpbzE9GdHGgTykUFldJp7NRwqy_w9oRavmDwhrZQLPfx3bkYFxQXSHmT8ebXbWc_snZU60-NLaxFj5-SBeXudZGrHBc8ehGZ4QfwoufFx1PpSRfmdDf2WdiZLJc93RmN_8LgNOrF18_ESPmq8CuVAyDL3-LQEMTCYOH8SgeegCPPrZhfCn1UcZIHGhvWlmEo1AAYjceX9Fll1yZjLgJ-Ua0Gg",
    alt: "Áo thun trắng cổ tròn minimalist trên mannequin vô hình nền slate",
    displayOrder: 0,
    isPrimary: true,
  },
  {
    id: 2,
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAuP9o5nRLoC1X1Jb_LI2cWrDwJYg1xITCu0Zm6V6VPaeg1D4mAtGq0WZ5Xi5HMXF1esv5OZOdslklxyOzZDYuwrPQw7PajVP4QyWdVluCxM50HZgX9QH2umMF4YeM04tG4ZeMXkRZPp_SNjUie5WO1tJKvPUZdntkAOdWfG1kqHlGC9xvHAq2naNwnjm5E8Y0sGZxF_u11ApKLJH9JZ5fGvyo3kB1Uh_z1xu-Qcol7nW_-Mrh9hLqLsg",
    alt: "Thumbnail vuông áo trắng cổ tròn cotton",
    displayOrder: 1,
    isPrimary: false,
  },
  {
    id: 3,
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBO8_Zo2ZDE_qO8cv17gSE8IVujApE6Y-DuqmKAqs2_lPTTSgjnOrxblfc90Vebh5pOqtUTmv1muCH0bf0SGXKrDBke-K8yp8Jacu330V9R0fLY6MuAHoZi23H0-S8PphOlBLK1Wg_UBo6nXahez_jqe-VlUy9uStU3u5qZnN30oTOz6Yw7P18vnlP8YfixvkpZaqzHXVsBNrZMa9-yc1SMTgWSW6cvzwg4pgFpTepLVzTMuA1sVspKcA",
    alt: "Cận cảnh dệt kim cotton compact 220gsm",
    displayOrder: 2,
    isPrimary: false,
  },
  {
    id: 4,
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBH5ayZW6scmqfc5TSPKqjIPi9DRljogKQJZqGe8H49ZVmc_TMCxfu5ODKIF0MFCsCVw0RReCNbLXTIgGeRFTEIHlNDtjE-IZlJk6yqyTme0b0vaIne6pmiBcC4NaERXHsQSTwE2te06ddS8EKQKNzVqzkhCIbuNdNb4H0YF6yXCd0zMepQ0jbiUA4zxo_8asQSTzaRxy5Gm0Go_bgK0qeDYNP5Vsqncjz5mf7wpEze3goyEbX4Vg6eIQ",
    alt: "Model mặc áo trắng trong quán cafe urban",
    displayOrder: 3,
    isPrimary: false,
  },
  {
    id: 5,
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP_NxlMqzhsGsdA3GYuxBAH6iwDvqTArn9L-PU7JiTqAqowPcT48mi-h7Z4J2YwVrbSclYNbuORGRZajROwxDq074ZFnHK2F5D5bVnn3-9HoF0RPg6bcPWSGwrZ4o9g6QwhBcqluryW-58KAWTWGuCbpnr1vfYMnRmtpFzCrNs_q9zbvwXAHil4hAskFP-wGmHUoeR2liaKzWfP6rs9mzc1jRvQQ4HTlXzbxQqPCUEG2IRs0_dmpV-8w",
    alt: "Áo vàng pastel trên nền ấm",
    displayOrder: 4,
    isPrimary: false,
  },
];

// ── Tier variation configs ───────────────────────────────────────────────
// Key English (BE runtime) — quyết định 2026-10-18: 'be-only'.
const TIER_CONFIGS: TierVariationConfig[] = [
  { name: "Color", options: ["Trắng Tinh Khôi", "Đen Huyền Bí", "Vàng Pastel"] },
  { name: "Size", options: ["S", "M", "L", "XL"] },
];

// ── Variants (3 màu x 4 size, XL hết hàng) ───────────────────────────────
const COLORS: Array<{ name: string; bgClass: string }> = [
  { name: "Trắng Tinh Khôi", bgClass: "bg-slate-100" },
  { name: "Đen Huyền Bí", bgClass: "bg-slate-900" },
  { name: "Vàng Pastel", bgClass: "bg-amber-200" },
];

const SIZES = ["S", "M", "L", "XL"] as const;
const OOS_SIZES = new Set<string>(["XL"]);

const VARIANTS: ProductVariant[] = COLORS.flatMap((color, colorIdx) =>
  SIZES.map((size, sizeIdx) => {
    const id = colorIdx * 4 + sizeIdx + 1;
    const isOOS = OOS_SIZES.has(size);
    return {
      id,
      productId: 1,
      sku: `UTC-TS-001-${color.name.split(" ")[0].toUpperCase()}-${size}`,
      variantName: `${color.name}, ${size}`,
      attributes: { Color: color.name, Size: size },
      originalPrice: 159000,
      stockQuantity: isOOS ? 0 : 48,
      imageUrl: null,
      status: isOOS ? ("OUT_OF_STOCK" as const) : ("ACTIVE" as const),
      isDisabled: isOOS,
      version: 1,
      createdAt: "2026-10-01T00:00:00Z",
    };
  })
);

// ── Flash sales (BE shape — array, slot ACTIVE) ───────────────────────────
// 1 slot ACTIVE + 1 slot UPCOMING để test render UI có thể pick đầu tiên.
const FLASH_SALES: ActiveFlashSaleDto[] = [
  {
    slotId: 1,
    slotStartTime: "2026-10-14T12:00:00Z",
    slotEndTime: "2026-10-14T18:00:00Z",
    slotStatus: "ACTIVE",
    itemId: 1,
    variantId: 1,
    originalPrice: 159000,
    flashSalePrice: 89000,
    stockAvailable: 28, // 100 - 72 đã bán
  },
];

// ── Reviews (3 sample — BE sẽ trả empty ở runtime; defer endpoint reviews) ─
const REVIEWS: Review[] = [
  {
    id: 1,
    userId: 101,
    userDisplayName: "nguyenvan_92",
    userAvatarColor: "bg-primary-fixed text-primary",
    rating: 5,
    content:
      "Áo giao cực kỳ ưng ý luôn mọi người ơi! Chất vải cotton dày dặn 220gsm sờ rất đã tay mà mặc lên mát mẻ không bị bí bách. Form áo chuẩn mẫu, giặt lần đầu nước lạnh không hề co rút hay xù lông. Rất hài lòng với chất lượng của UTC Fashion!",
    variantSku: "UTC-TS-001-WHT-L",
    variantAttributes: { "Màu Sắc": "Trắng", "Kích Thước": "L" },
    mediaUrls: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCH5C_-wn2G7-YJX5py51QDlQD4I9MEmwWsYA7bss1NdXZzfyoaU4wflrYiU6n76Ocqw4dGQ_vCWu3yGfCeBoQVoJbZo02k5NWzm1Lt45Ivze_2AZ_DAIWOsm2iremzXeFYf3jX94v6f0XeX8dtMPwcgOQJJum64UrKTGBfqfgJHzh_-BrDud5OXdnfJI-bM29a0nSr3lCLUmK9Jr9nQG-1O52yqYBXfy9a-CTkRnqt9dK8V6YSh3teZg",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC08F6yLWhOAcjEmHxNCLD54m8B6aHVTSnAo4Ag2577iYaUZAsILVO4jVqJTzprhsP048lUDwUwaLHMrOQNAQWzS7BghQiSIye85B75q4lzc4TtG11LzI4nUx7nt-wBN41wuX2uEnG1qTwjvnNRUq9ho2Vjmt11X4HZEXb790ORkTnTJCxyW51DOw8p21rJgnCumQS1TLOSSAEgRNhMEgWVyqAgokF1XpDKeLoFWsvQeTxOOPT2SY70HQ",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA1wB7rFpiVhbMCskDmy1XlW1fXZL8Mh4ORWvd9yBOQXSq5GbTQSUJelGU_hXex8IguXn14pfvEFI9B2VaoepAAKKY7gCi68U29_tVRqLkSfPlGTcZ3z0PsRFEPnxPCrIj_PLD6nxqW36vnFdDka5IIoElhl68aGUzDOIsxt80NjquW1WSHbDxJq2h4BpmXE1JOFI3pADzfg7A_xpwdtWkoUafCGBt4BcV2BTiyeRPtlqUjQuOrai5_xw",
    ],
    sellerReply: {
      content:
        "Dạ UTC chân thành cảm ơn bạn nguyenvan_92 đã tin tưởng ủng hộ sản phẩm của shop ạ! Chúc bạn luôn tự tin và có những trải nghiệm thật tuyệt vời cùng chiếc áo thun này nhé!",
      storeName: "UTC Fashion",
      repliedAt: "2026-10-10T10:00:00Z",
    },
    isVerifiedPurchase: true,
    createdAt: "2026-10-10T08:00:00Z",
  },
  {
    id: 2,
    userId: 102,
    userDisplayName: "tran_thanh_huyen",
    userAvatarColor: "bg-secondary-fixed text-secondary",
    rating: 5,
    content:
      "Đóng gói cẩn thận 2 lớp kèm túi zip xịn xò, mở hộp ra thơm phức mùi nước hoa nhẹ nhàng. Màu đen tuyền rất sang, không bị xỉn màu. 10 điểm cho sự chỉn chu của shop.",
    variantSku: "UTC-TS-001-DEN-M",
    variantAttributes: { "Màu Sắc": "Đen", "Kích Thước": "M" },
    mediaUrls: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA1eFQomJhyTVC0UuD571qcAlkyHyX1-NV0VK5uG_PY3jeaJ3hLNCPJsUVeVw99NwmVsnN9YotuFqpbF4YKgfEQGK5fw_lvDp-zowIDaOPoEopuw3RUS40S9P9KYMGjtcJWJi0087G-OOQbWRxI1S-B0BoFI-6DCUhin1S46plEc8rCfD1FBQBAdbAtGNcVK8B9bu6BSBKObo2eyOoyAOcf7QulBlTHqmLEBIe8KhngQ23MD5qW-HY2rQQ",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDp0VoTfJqshIFMstqsylewBM_u0HbwBH_zGFRCPpZYomcxRkIopj-xq9SNdjRFzcERa8NLL7_n_2OrRjtwU-8s5Kha4bJ61XL40z8r9RC1jqY5raSzb4PvDchOpy-7RcDEgD_NKFXX5pB0UuXPTu6-3LLiHdSdURNuXlNTQOZIAYiyVxVk1ueLy9eGRqrCnZ2_78h0lEQOMp3bpOCrYwEDChjydTN0fQcqPBLGzg07WlL-PtxTqkvJQ",
    ],
    sellerReply: null,
    isVerifiedPurchase: true,
    createdAt: "2026-10-07T08:00:00Z",
  },
  {
    id: 3,
    userId: 103,
    userDisplayName: "minh_vu_tech",
    userAvatarColor: "bg-surface-container text-on-surface",
    rating: 4,
    content:
      "Màu vàng pastel ngoài đời đẹp hơn trong ảnh web nhiều nha, mặc sáng da tôn nét lắm. Trừ 1 sao do bên đơn vị vận chuyển giao trễ hơn dự kiến nửa ngày, còn chất lượng sản phẩm thì rất okela.",
    variantSku: "UTC-TS-001-VANG-S",
    variantAttributes: { "Màu Sắc": "Vàng nhạt", "Kích Thước": "S" },
    mediaUrls: [],
    sellerReply: null,
    isVerifiedPurchase: true,
    createdAt: "2026-10-05T08:00:00Z",
  },
];

// ── Size chart (BE shape — object {large, standard}) ──────────────────────
const SIZE_CHART: SizeChartDto = {
  large: { width_cm: 56, height_cm: 75 },
  standard: { width_cm: 50, height_cm: 69 },
};

// ── Features (5 string theo BE) ────────────────────────────────────────────
const FEATURES: string[] = [
  "Thoáng khí tối đa nhờ cấu trúc dệt mắt lưới siêu nhỏ",
  "Co giãn 4 chiều, đàn hồi tự nhiên nhờ kỹ thuật xe sợi xoắn kép",
  "Bo cổ dệt gân 3 lớp chống quăn mép, giữ nếp chuẩn form",
  "Cotton Compact 220gsm chải kỹ, giảm xù lông, thấm hút vượt trội",
  "Form Regular Fit hiện đại chuẩn cơ thể người trẻ Việt",
];

// ── Store profile (BE không có joinedAt) ──────────────────────────────────
const STORE_PROFILE: StoreProfile = {
  id: 1,
  name: "UTC Fashion Official",
  initials: "UTC",
  initialsBgClass: "bg-primary text-on-primary",
  isOfficial: true,
  ratingAvg: 4.9,
  ratingCount: 42500,
  productCount: 128,
  productCountUnit: "mẫu",
  responseRate: 99,
  responseTimeLabel: "Vài phút",
  lastActiveLabel: "Online 5 phút trước",
};

// ── Vouchers (2) ──────────────────────────────────────────────────────────
const VOUCHERS: ShopVoucher[] = [
  { id: 1, label: "Giảm 10K đơn từ 200K" },
  { id: 2, label: "Giảm 5% tối đa 30K" },
];

// ── Shipping ──────────────────────────────────────────────────────────────
const SHIPPING: ShippingInfo = {
  freeshipBadge: "FREESHIP XTRA",
  freeshipText: "Miễn phí vận chuyển đơn từ 150K",
  shipTo: "Phường Tăng Nhơn Phú B, TP. Thủ Đức (Quận 9), TP.HCM",
  estimatedDays: "1 - 2 ngày làm việc",
};

// ── Commitments (mirror BE shape) ─────────────────────────────────────────
const COMMITMENTS: BackendProductCommitment = {
  return_days: 30,
  warranty_months: 6,
  authentic_guarantee: true,
  shipping_time_hours: 48,
  free_shipping_threshold: 0,
};

// ── Description rich (BE shape — object) ──────────────────────────────────
const DESCRIPTION_RICH: DescriptionRichDto = {
  intro:
    "Áo thun basic unisex UTC Basic Cotton Compact — sản phẩm chủ lực định nghĩa tiêu chuẩn mới cho thời trang tối giản thường nhật tại Việt Nam.",
  highlights: [
    "Sợi 100% Organic Cotton Compact cao cấp chải kỹ 2 lượt",
    "Định lượng 220gsm dày dặn nhưng vẫn thoáng mát",
    "Form Regular Fit hiện đại chuẩn cơ thể người trẻ Việt",
    "Bo cổ dệt gân 3 lớp chống quăn mép",
  ],
  paragraphs: [
    "Sử dụng sợi 100% Organic Cotton Compact cao cấp chải kỹ 2 lượt, bề mặt vải giảm thiểu tối đa hiện tượng xù lông, tăng cường độ bóng mịn tự nhiên và khả năng thấm hút mồ hôi vượt trội trong điều kiện khí hậu nhiệt đới.",
    "Thiết kế form dáng Regular Fit hiện đại chuẩn form cơ thể người trẻ Việt, phần vai ôm gọn gàng, độ dài thân áo vừa vặn giúp tôn dáng linh hoạt cho cả nam và nữ dù kết hợp cùng quần short năng động, quần âu thanh lịch hay phong cách street style.",
  ],
};

// ── Specs (BE shape — object 4 field) ─────────────────────────────────────
const SPECS: ProductSpecsDto = {
  origin: "Việt Nam (Xưởng dệt kim UTC Tân Bình)",
  weight: "220gsm (cotton compact)",
  material: "100% Organic Cotton Compact chải kỹ 2 lượt",
  warranty: "6 tháng (lỗi nhà sản xuất)",
};

// ── Rating distribution (BE bổ sung) ──────────────────────────────────────
const RATING_DISTRIBUTION: RatingDistributionDto = {
  stars5: 250,
  stars4: 50,
  stars3: 15,
  stars2: 6,
  stars1: 5,
};

// ── Related products (RelatedProductSummary — BE int64 id) ────────────────
const RELATED_SAME_STORE: RelatedProductSummary[] = [
  {
    id: 2,
    storeId: 1,
    storeName: "UTC Fashion Official",
    categoryId: 1,
    categoryName: "Thời trang Unisex",
    name: "Quần short kaki co giãn",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAUJlgK01EGGFJNYSutryWBJwFdmM7KcyeyWSEkGB7WI_PmzmdoeeV0FSapM2nga-i9IOp4xUZjDfGVWcqSBgdpmA1GeTcakIL5-lAqMQX3EF0z604qQv3xxPMbxzWdgi7_TEkIfzc20EixemOuOg3iMKAxaBbEhZKVaQ6_kBfeo_6nDu6X4K8dtXtu8Nl3_G_qjOjoGEYTxoj_tjtFnXkv1gRwTodsYebNzpJvo2wIOlZBMwGZEC8HIA",
    minPrice: 139000,
    maxPrice: 139000,
    totalStock: 890,
    status: "ACTIVE",
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: 3,
    storeId: 1,
    storeName: "UTC Fashion Official",
    categoryId: 1,
    categoryName: "Thời trang Unisex",
    name: "Áo polo pique thoáng mát",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCvWRhY0wZNHqWvOWyZjGsD1P-vrj5fbqJ3-owYFyC1NwpZX6rxELyGcJ4aO3jhibdwRVLsTdWUoLbrY0TMbuBq1lgnwi3N6nDFBGULfSV216B5pSPWrVKFMjD4w4H4PowtQF5gQMcZ4KZYMMhWHAjI5M0BuPpnbm8HiFPUnNqwLD4vZtvsB3_cSf9x1hIenUD39QT-JAc_lG_SUIhKN6oltxq0nuviNQ3ta7Scwe5PF8YcmuF4WXWlEw",
    minPrice: 189000,
    maxPrice: 189000,
    totalStock: 1400,
    status: "ACTIVE",
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: 4,
    storeId: 1,
    storeName: "UTC Fashion Official",
    categoryId: 1,
    categoryName: "Thời trang Unisex",
    name: "Áo thun oversize graphic",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArsIHTzqJ6sujvj8itO7BjiYWpgrE3pM5uyJLL7EEMqyYj2N9UBIBMxCVb59UMlOZFKf_mx3J4C6H60o1UAUZ_XVqrplEhbE7n2tbGvrheXtmxsOUrW2gL4I4FjtcFICv5UhDvsDfU2c5pHs6yZCmI7Pl9rj6kJJB3SabijYODA4K1IbtsfNEPPLbBpT8NFfTcyeWtyGPG7TwFmN1_ngYbf3SeohukYpInA2wOnlM--TV5R9VKrRE-JA",
    minPrice: 179000,
    maxPrice: 179000,
    totalStock: 3200,
    status: "ACTIVE",
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: 5,
    storeId: 1,
    storeName: "UTC Fashion Official",
    categoryId: 1,
    categoryName: "Thời trang Unisex",
    name: "Quần jogger nỉ cotton",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDcvF-gyXALBTYu9iKrKwCgOqhzfjNb-_1ytKHkVsAy5P5qn55MGUj-Pmza4qNfieBbknF-GJvwFkjbzQXrgf50zv6I_CSN8GRDP4xpKYD7ck6DcfpGnV0vUoA7dHVpo5VNfrjlpBGFgvhBD5G1xG2yL1LAZGs98ZVp8TABYI4sdIRsZ3-iFG3dSNFTCAFyDelWPVzj5Y-Y1iHcBCj1hQU430nPmnPQuWx5tBj_YWMShTDs0bh5lTrUtA",
    minPrice: 219000,
    maxPrice: 219000,
    totalStock: 640,
    status: "ACTIVE",
    createdAt: "2026-10-01T00:00:00Z",
  },
];

const RELATED_BEST_SELLERS: RelatedProductSummary[] = [
  {
    id: 6,
    storeId: 2,
    storeName: "TechZone Official",
    categoryId: 2,
    categoryName: "Women Fashion",
    name: "Áo Boxy Heavy Cotton",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtEr9mnVPdaSTUNzwHtuHTUOdEoxEUr0D2fVZYv28x-hTvMi36tGzQYnWq6Z3bFFJXNEpoYrMIjdm-tqYc8xn32RmMgaK-B__NAXn5XtxLa35EJVatWLyuIElnwAT5wNbzK3tFBW6fLSDCJ3Um4a2kOkq_TR_jpjq53-vDWdtd0JsHPjNQYJ8-jdYA0cKJSzL0cQGlZHyIaIWyiYr7vyktm2waawYeG6QTqvqIDQA_9KRBPZJHWeb-Dg",
    minPrice: 145000,
    maxPrice: 145000,
    totalStock: 4800,
    status: "ACTIVE",
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: 7,
    storeId: 3,
    storeName: "Mom and Baby Shop",
    categoryId: 2,
    categoryName: "Women Fashion",
    name: "Áo thun thể thao Dri-Fit",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDsdekfAo8dA-aacAbD6EgmGPaD1U4STNwS2gAgVJDuxbVYyk5OdK3AVGwEvefHBWErudCzRRWC1EWpCkg0eiQtjntI4N7HpO7keEAHLPndaYfXKHkTkQbTM1ABISpfWg20cK11T5GLXv25kfKal05ryFtMFDzMkSmNHOYZ2xvCYWR0UIGjIfHJuXKKI0zL-eHupdrnfhHyMMKdxXAvBon_i3rg1IH19GzuuU7Aa5vRjAXOLiyYBFV4mA",
    minPrice: 129000,
    maxPrice: 129000,
    totalStock: 2100,
    status: "ACTIVE",
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: 8,
    storeId: 2,
    storeName: "Fashion Street",
    categoryId: 2,
    categoryName: "Women Fashion",
    name: "Áo thun tay dài sọc ngang",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA1zK40TQCSqu197sFsxL-Iz-ZX7-3UuQq_xEf7YcDv5yfMCI5XxcRafw2dSowtn3G-TG-tB-dUnSGGsqAy9-jDmHX0I4kuDqvBgc_eqO-JugauOVrwBtN3Nd9VHLhEM25yihj1pgNV3DXjDRi3xej23y04zMVHobKMBrQXmccrBRAxWCU_A9NhwGxxeZRm9djmO8F0oxTM6GEO6xjuwqYbwQB4yRSUt_24iPXFw5f9UuO-wipiY95pmA9Dw",
    minPrice: 169000,
    maxPrice: 169000,
    totalStock: 950,
    status: "ACTIVE",
    createdAt: "2026-10-01T00:00:00Z",
  },
];

// ── Main mock ─────────────────────────────────────────────────────────────
export const mockProductDetail: ProductDetail = {
  id: 1,
  slug: "ao-thun-unisex-cotton-utc-basic",
  storeId: 1,
  storeName: "UTC Fashion Official",
  categoryId: 1,
  categoryName: "Thời trang Unisex",
  name: "Áo thun unisex cotton UTC Basic thoáng khí dệt kim cao cấp",
  imageUrl: PRODUCT_IMAGES[0].url,
  description: `${DESCRIPTION_RICH.intro} ${DESCRIPTION_RICH.paragraphs.join(" ")}`,
  tierVariationConfigs: TIER_CONFIGS,
  status: "ACTIVE",
  createdAt: "2026-10-01T00:00:00Z",

  ratingAvg: 4.8,
  ratingCount: 326,
  soldCount: 2100,
  questionCount: 76,
  // FE mock giữ giá trị số (BE có thể null khi variant chưa set — defer test null).
  minPrice: 89000,
  maxPrice: 159000,
  discountPercent: 44,
  images: PRODUCT_IMAGES,
  flashSales: FLASH_SALES,
  reviews: REVIEWS,
  relatedSameStore: RELATED_SAME_STORE,
  relatedBestSellers: RELATED_BEST_SELLERS,
  variants: VARIANTS,
  specs: SPECS,
  sizeChart: SIZE_CHART,
  features: FEATURES,
  descriptionRich: DESCRIPTION_RICH,
  storeProfile: STORE_PROFILE,
  vouchers: VOUCHERS,
  shipping: SHIPPING,
  commitments: COMMITMENTS,
  ratingDistribution: RATING_DISTRIBUTION,
};

/**
 * Mock store keyed by slug. Khi BE ready, có thể gọi qua
 * GET /api/v1/products/{id} (BE cần thêm slug lookup) hoặc
 * GET /api/v1/products/slug/{slug}.
 */
export const mockProductsBySlug: Record<string, ProductDetail> = {
  [mockProductDetail.slug]: mockProductDetail,
};

export const mockProductIdToSlug: Record<number, string> = {
  [mockProductDetail.id]: mockProductDetail.slug,
};

export const mockAllProductSlugs = Object.keys(mockProductsBySlug);