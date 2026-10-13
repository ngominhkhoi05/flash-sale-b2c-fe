/**
 * Mock data cho Product Detail page.
 * Mirror `ProductDetailResponse` của BE + bổ sung field Stitch yêu cầu
 * (xem docs/superpowers/plans/2026-10-12-product-detail-be-required.md).
 *
 * Khi BE bổ sung Phase 1 P0 (rating, soldCount, images[], reviews, related),
 * sẽ xoá các field bổ sung ở đây và gọi API thật.
 */

import type {
  ProductDetail,
  ProductImage,
  ProductVariant,
  Review,
  SizeChartRow,
  ProductFeature,
  StoreProfile,
  ShopVoucher,
  ShippingInfo,
  CommitmentBadge,
  FlashSaleInfo,
  TierVariationConfig,
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
const TIER_CONFIGS: TierVariationConfig[] = [
  { name: "Màu Sắc", options: ["Trắng Tinh Khôi", "Đen Huyền Bí", "Vàng Pastel"] },
  { name: "Kích Thước", options: ["S", "M", "L", "XL"] },
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
      attributes: { "Màu Sắc": color.name, "Kích Thước": size },
      originalPrice: 159000,
      stockQuantity: isOOS ? 0 : 48,
      imageUrl: "",
      status: isOOS ? ("OUT_OF_STOCK" as const) : ("ACTIVE" as const),
      isDisabled: isOOS,
      version: 1,
      createdAt: "2026-10-01T00:00:00Z",
    };
  })
);

// ── Flash sale info ───────────────────────────────────────────────────────
const FLASH_SALE: FlashSaleInfo = {
  flashSaleItemId: 1,
  variantId: 1,
  price: 89000,
  originalPrice: 159000,
  discountPercent: 44,
  totalStock: 100,
  soldStock: 72,
  maxQtyPerUser: 2,
  endsAt: "2026-10-14T18:00:00Z",
};

// ── Reviews (3 sample) ────────────────────────────────────────────────────
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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA1eFQomJhyTVC0UuD571qcAlkyHyX1-NV0VK5uG_PY3jeaJ3hLNCPJsUVeVw4NwmVsnN9YotuFqpbF4YKgfEQGK5fw_lvDp-zowIDaOPoEopuw3RUS40S9P9KYMGjtcJWJi0087G-OOQbWRxI1S-B0BoFI-6DCUhin1S46plEc8rCfD1FBQBAdbAtGNcVK8B9bu6BSBKObo2eyOoyAOcf7QulBlTHqmLEBIe8KhngQ23MD5qW-HY2rQQ",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDp0VoTfJqshIFMstqsylewBM_u0HbwBH_zGFRCPpZYomcxRkIopj-xq9SNdjRFzcERa8NLL7_n_2OrRjtwU-8s5Kha4bJ61XL40z8r9RC1jqY5raSzb4PvDchOpy-7RcDEgD_NKFXX5pB0UuXPTu6-3LLiHdSdURNuXlNTQOZIAYiyVxVk1ueLy9eGRqrCnZ2_78h0lEQOMp3bpOCrjYwEDChjydTN0fQcqPBLGzg07WlL-PtxTqkvJQ",
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

// ── Size chart (4 size) ───────────────────────────────────────────────────
const SIZE_CHART: SizeChartRow[] = [
  { size: "S", height: "1m50 - 1m62", weight: "45 - 55 kg", width: "48 cm", length: "66 cm", isCurrent: false, isOutOfStock: false },
  { size: "M", height: "1m60 - 1m70", weight: "55 - 65 kg", width: "50 cm", length: "69 cm", isCurrent: true, isOutOfStock: false },
  { size: "L", height: "1m68 - 1m78", weight: "65 - 75 kg", width: "53 cm", length: "72 cm", isCurrent: false, isOutOfStock: false },
  { size: "XL", height: "1m75 - 1m85", weight: "75 - 88 kg", width: "56 cm", length: "75 cm", isCurrent: false, isOutOfStock: true },
];

// ── Features (3) ──────────────────────────────────────────────────────────
const FEATURES: ProductFeature[] = [
  {
    icon: "air",
    iconBgClass: "bg-primary-fixed",
    iconTextClass: "text-primary",
    title: "Thoáng Khí Tối Đa",
    description:
      "Cấu trúc dệt mắt lưới siêu nhỏ giúp lưu thông khí và bay hơi nhanh chóng trong ngày nắng nóng.",
  },
  {
    icon: "all_inclusive",
    iconBgClass: "bg-secondary-container",
    iconTextClass: "text-on-secondary-container",
    title: "Co Giãn 4 Chiều",
    description:
      "Độ đàn hồi tự nhiên nhờ kỹ thuật xe sợi xoắn kép, hạn chế dão form sau nhiều lần giặt.",
  },
  {
    icon: "layers",
    iconBgClass: "bg-surface-container-highest",
    iconTextClass: "text-on-surface",
    title: "Bo Cổ Dệt Gân 3 Lớp",
    description:
      "Cổ áo bổ sung sợi spandex tăng cường độ đàn hồi, chống quăn mép và giữ nếp chuẩn form.",
  },
];

// ── Store profile ─────────────────────────────────────────────────────────
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
  joinedAt: "2024-10-12T00:00:00Z",
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

// ── Commitments (3) ───────────────────────────────────────────────────────
const COMMITMENTS: CommitmentBadge[] = [
  { icon: "eco", iconClass: "text-secondary", label: "100% Cotton Tự Nhiên" },
  { icon: "published_with_changes", iconClass: "text-primary", label: "Đổi trả 30 ngày dễ dàng" },
  { icon: "verified_user", iconClass: "text-secondary", label: "Bảo hành may 6 tháng" },
];

// ── Description (2 paragraphs) ────────────────────────────────────────────
const DESCRIPTION_RICH = [
  "Áo thun basic unisex <strong>UTC Basic Cotton Compact</strong> là sản phẩm chủ lực định nghĩa tiêu chuẩn mới cho thời trang tối giản thường nhật tại Việt Nam. Sử dụng sợi <strong>100% Organic Cotton Compact</strong> cao cấp chải kỹ 2 lượt, bề mặt vải giảm thiểu tối đa hiện tượng xù lông, tăng cường độ bóng mịn tự nhiên và khả năng thấm hút mồ hôi vượt trội trong điều kiện khí hậu nhiệt đới.",
  "Thiết kế form dáng <em>Regular Fit</em> hiện đại chuẩn form cơ thể người trẻ Việt, phần vai ôm gọn gàng, độ dài thân áo vừa vặn giúp tôn dáng linh hoạt cho cả nam và nữ dù kết hợp cùng quần short năng động, quần âu thanh lịch hay phong cách street style.",
];

// ── Related products (4 cùng shop, 3 bán chạy) ───────────────────────────
const RELATED_SAME_STORE = [
  {
    id: "2",
    name: "Quần short kaki co giãn",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAUJlgK01EGGFJNYSutryWBJwFdmM7KcyeyWSEkGB7WI_PmzmdoeeV0FSapM2nga-i9IOp4xUZjDfGVWcqSBgdpmA1GeTcakIL5-lAqMQX3EF0z604qQv3xxPMbxzWdgi7_TEkIfzc20EixemOuOg3iMKAxaBbEhZKVaQ6_kBfeo_6nDu6X4K8dtXtu8Nl3_G_qjOjoGEYTxoj_tjtFnXkv1gRwTodsYebNzpJvo2wIOlZBMwGZEC8HIA",
    imageAlt: "Quần short kaki co giãn",
    price: 139000,
    totalSold: 890,
    href: "/products/quan-short-kaki-co-gian",
  },
  {
    id: "3",
    name: "Áo polo pique thoáng mát",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCvWRhY0wZNHqWvOWyZjGsD1P-vrj5fbqJ3-owYFyC1NwpZX6rxELyGcJ4aO3jhibdwRVLsTdWUoLbrY0TMbuBq1lgnwi3N6nDFBGULfSV216B5pSPWrVKFMjD4w4H4PowtQF5gQMcZ4KZYMMhWHAjI5M0BuPpnbm8HiFPUnNqwLD4vZtvsB3_cSf9x1hIenUD39QT-JAc_lG_SUIhKN6oltxq0nuviNQ3ta7Scwe5PF8YcmuF4WXWlEw",
    imageAlt: "Áo polo pique xanh navy",
    price: 189000,
    totalSold: 1400,
    href: "/products/ao-polo-pique-thoang-mat",
  },
  {
    id: "4",
    name: "Áo thun oversize graphic",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArsIHTzqJ6sujvj8itO7BjiYWpgrE3pM5uyJLL7EEMqyYj2N9UBIBMxCVb59UMlOZFKf_mx3J4C6H60o1UAUZ_XVqrplEhbE7n2tbGvrheXtmxsOUrW2gL4I4FjtcFICv5UhDvsDfU2c5pHs6yZCmI7Pl9rj6kJJB3SabijYODA4K1IbtsfNEPPLbBpT8NFfTcyeWtyGPG7TwFmN1_ngYbf3SeohukYpInA2wOnlM--TV5R9VKrRE-JA",
    imageAlt: "Áo thun oversize graphic",
    price: 179000,
    totalSold: 3200,
    href: "/products/ao-thun-oversize-graphic",
  },
  {
    id: "5",
    name: "Quần jogger nỉ cotton",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDcvF-gyXALBTYu9iKrKwCgOqhzfjNb-_1ytKHkVsAy5P5qn55MGUj-Pmza4qNfieBbknF-GJvwFkjbzQXrgf50zv6I_CSN8GRDP4xpKYD7ck6DcfpGnV0vUoA7dHVpo5VNfrjlpBGFgvhBD5G1xG2yL1LAZGs98ZVp8TABYI4sdIRsZ3-iFG3dSNFTCAFyDelWPVzj5Y-Y1iHcBCj1hQU430nPmnPQuWx5tBj_YWMShTDs0bh5lTrUtA",
    imageAlt: "Quần jogger nỉ cotton",
    price: 219000,
    totalSold: 640,
    href: "/products/quan-jogger-ni-cotton",
  },
];

const RELATED_BEST_SELLERS = [
  {
    id: "6",
    name: "Áo Boxy Heavy Cotton",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtEr9mnVPdaSTUNzwHtuHTUOdEoxEUr0D2fVZYv28x-hTvMi36tGzQYnWq6Z3bFFJXNEpoYrMIjdm-tqYc8xn32RmMgaK-B__NAXn5XtxLa35EJVatWLyuIElnwAT5wNbzK3tFBW6fLSDCJ3Um4a2kOkq_TR_jpjq53-vDWdtd0JsHPjNQYJ8-jdYA0cKJSzL0cQGlZHyIaIWyiYr7vyktm2waawYeG6QTqvqIDQA_9KRBPZJHWeb-Dg",
    imageAlt: "Áo Boxy Heavy Cotton",
    price: 145000,
    rating: 4.9,
    totalSold: 4800,
    href: "/products/ao-boxy-heavy-cotton",
  },
  {
    id: "7",
    name: "Áo thun thể thao Dri-Fit",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDsdekfAo8dA-aacAbD6EgmGPaD1U4STNwS2gAgVJDuxbVYyk5OdK3AVGwEvefHBWErudCzRRWC1EWpCkg0eiQtjntI4N7HpO7keEAHLPndaYfXKHkTkQbTM1ABISpfWg20cK11T5GLXv25kfKal05ryFtMFDzMkSmNHOYZ2xvCYWR0UIGjIfHJuXKKI0zL-eHupdrnfhHyMMKdxXAvBon_i3rg1IH19GzuuU7Aa5vRjAXOLiyYBFV4mA",
    imageAlt: "Áo thun thể thao Dri-Fit",
    price: 129000,
    rating: 4.8,
    totalSold: 2100,
    href: "/products/ao-thun-the-thao-dri-fit",
  },
  {
    id: "8",
    name: "Áo thun tay dài sọc ngang",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA1zK40TQCSqu197sFsxL-Iz-Z7xQ8q_xEf7YcDv5yfMCI5XxcRafw2dSowtn3G-TG-tB-dUnSGGsqAy9-jDmHX0I4kuDqvBgc_eqO-JugauOVrwBtN3Nd9VHLhEM25yihj1pgNV3DXjDRi3xej23y04zMVHobKMBrQXmccrBRAxWCU_A9NhwGxxeZRm9djmO8F0oxTM6GEO6xjuwqYbwQB4yRSUt_24iPXFw5f9UuO-wipiY95pmA9Dw",
    imageAlt: "Áo thun tay dài sọc ngang",
    price: 169000,
    rating: 4.7,
    totalSold: 950,
    href: "/products/ao-thun-tay-dai-soc-ngang",
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
  images: PRODUCT_IMAGES,
  description: DESCRIPTION_RICH.join(" "),
  tierVariationConfigs: TIER_CONFIGS,
  status: "ACTIVE",
  createdAt: "2026-10-01T00:00:00Z",

  ratingAvg: 4.8,
  ratingCount: 326,
  soldCount: 2100,
  questionCount: 76,
  minPrice: 89000,
  maxPrice: 159000,
  discountPercent: 44,
  flashSale: FLASH_SALE,
  reviews: REVIEWS,
  relatedSameStore: RELATED_SAME_STORE,
  relatedBestSellers: RELATED_BEST_SELLERS,
  variants: VARIANTS,
  specs: {
    category: "Vibe Mart > Thời trang Unisex > Áo thun cổ tròn",
    material: "100% Cotton Compact chải kỹ định lượng dày 220gsm",
    origin: "Việt Nam (Xưởng dệt kim UTC Tân Bình)",
    style: "Unisex suông vừa Regular Fit, tay lỡ nhẹ thoải mái",
    sku: "UTC-TS-001-WHT",
    careInstructions:
      "Giặt máy chế độ êm, lộn trái khi giặt và phơi bóng râm để bảo vệ màu sợi cotton",
  },
  sizeChart: SIZE_CHART,
  features: FEATURES,
  descriptionRich: DESCRIPTION_RICH,
  storeProfile: STORE_PROFILE,
  vouchers: VOUCHERS,
  shipping: SHIPPING,
  commitments: COMMITMENTS,
};

/**
 * Mock store keyed by slug. Khi BE ready, sẽ fetch qua
 * GET /api/v1/products/{id} (BE cần thêm slug lookup).
 */
export const mockProductsBySlug: Record<string, ProductDetail> = {
  [mockProductDetail.slug]: mockProductDetail,
};

export const mockAllProductSlugs = Object.keys(mockProductsBySlug);
