/**
 * Mock data cho các section trang chủ Storefront.
 * Dùng trong development / UI review trước khi có API.
 * TODO(api): thay thế bằng hook thật khi backend cung cấp data.
 */

// ─── Hero slides ─────────────────────────────────────────────────────────────

export interface HeroSlide {
  id: string;
  /** Click anywhere on the slide navigates to this href. */
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "10-10-tech-fashion",
    ctaHref: "/flash-sale",
    imageUrl:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80",
    imageAlt:
      "Siêu hội 10.10 – công nghệ & thời trang giảm đến 50%",
  },
  {
    id: "flash-sale-live",
    ctaHref: "/flash-sale",
    imageUrl:
      "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Flash Sale đang diễn ra – săn deal 0đ mỗi giờ",
  },
  {
    id: "voucher-freeship",
    ctaHref: "/kho-voucher",
    imageUrl:
      "https://images.unsplash.com/photo-1556742208-999815fca738?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Voucher & Freeship Xtra – giảm đến 200K đơn đầu tiên",
  },
  {
    id: "new-arrivals",
    ctaHref: "/san-pham?sort=newest",
    imageUrl:
      "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Hàng mới về mỗi ngày – cập nhật xu hướng",
  },
];

// ─── Category grid ────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: "fashion-male", labelKey: "categoryGrid.items.mensFashion", icon: "man", href: "/danh-muc/thoi-trang-nam" },
  { id: "fashion-female", labelKey: "categoryGrid.items.womensFashion", icon: "woman", href: "/danh-muc/thoi-trang-nu" },
  { id: "smartphone", labelKey: "categoryGrid.items.phone", icon: "smartphone", href: "/danh-muc/dien-thoai" },
  { id: "laptop", labelKey: "categoryGrid.items.laptop", icon: "laptop_mac", href: "/danh-muc/laptop" },
  { id: "headphones", labelKey: "categoryGrid.items.headphones", icon: "headphones", href: "/danh-muc/tai-nghe" },
  { id: "furniture", labelKey: "categoryGrid.items.furniture", icon: "chair", href: "/danh-muc/noi-that" },
  { id: "beauty", labelKey: "categoryGrid.items.beauty", icon: "spa", href: "/danh-muc/lam-dep" },
  { id: "mom-baby", labelKey: "categoryGrid.items.momBaby", icon: "child_friendly", href: "/danh-muc/me-va-be" },
  { id: "sports", labelKey: "categoryGrid.items.sports", icon: "fitness_center", href: "/danh-muc/the-thao" },
  { id: "books", labelKey: "categoryGrid.items.books", icon: "menu_book", href: "/danh-muc/sach" },
  { id: "grocery", labelKey: "categoryGrid.items.grocery", icon: "local_grocery_store", href: "/danh-muc/bach-hoa" },
  { id: "toys", labelKey: "categoryGrid.items.toys", icon: "toys", href: "/danh-muc/do-choi" },
  { id: "watches", labelKey: "categoryGrid.items.watches", icon: "watch", href: "/danh-muc/dong-ho" },
  { id: "auto", labelKey: "categoryGrid.items.auto", icon: "two_wheeler", href: "/danh-muc/xe-co" },
  { id: "bags", labelKey: "categoryGrid.items.bags", icon: "shopping_bag", href: "/danh-muc/tui-xach" },
  { id: "shoes", labelKey: "categoryGrid.items.shoes", icon: "steps", href: "/danh-muc/giay-dep" },
] as const;

// ─── Flash Sale deals ─────────────────────────────────────────────────────────

export interface FlashSaleDeal {
  id: string;
  imageUrl: string;
  imageAlt: string;
  name: string;
  flashPrice: string; // formatted VND
  originalPrice: string;
  discountPercent: number;
  soldCount: number;
  maxStock: number;
  limitPerBuyer: number;
  href: string;
}

export const FLASH_SALE_DEALS: FlashSaleDeal[] = [
  {
    id: "deal-1",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTahhXlUq2W9Q9ldTYa37CPBiyed_hyuwIHTzwLv1OdPmV_1o30ulvHdrsIukCiysWN8Rry7CKxKoZLQm35LcBhXxGqChOS8Cx4Vz7ktrugN1qcWX43SmH7zPqpUKzFkOv3IikC1s2cuKgKtofbVMWmVvSu9NXHQObW8_VOJ-3eCxNaXOokyotfpDwHDTQT-DJ-mZOYYd_8SR0yaIIZNJGpkCRyAaSYXSwruQWyMH2ZMeiq3OO0579gA",
    imageAlt: "Tai nghe không dây Bluetooth True Wireless thể thao chống ồn chủ động màu trắng tinh khôi",
    name: "Tai nghe True Wireless ANC thể thao chống ồn chủ động",
    flashPrice: "299.000₫",
    originalPrice: "550.000₫",
    discountPercent: 45,
    soldCount: 72,
    maxStock: 100,
    limitPerBuyer: 2,
    href: "/san-pham/tai-nghe-true-wireless-anc",
  },
  {
    id: "deal-2",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjZhqKsmXo3vH4cY9hN1dL2z8eP7mJ3kR5sT9wX4vA6bC2fD8gH1iJ0",
    imageAlt: "Áo thun nam cotton basic",
    name: "Áo thun nam cotton basic form rộng",
    flashPrice: "89.000₫",
    originalPrice: "199.000₫",
    discountPercent: 55,
    soldCount: 156,
    maxStock: 200,
    limitPerBuyer: 3,
    href: "/san-pham/ao-thun-nam-cotton",
  },
  {
    id: "deal-3",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkRmY2aT4vF9sJdK7pN3oQ5xB8eM6uH1iR9wT3vA2bD5fG7jH0kI1",
    imageAlt: "Kem chống nắng SPF50+",
    name: "Kem chống nắng SPF50+ PA++++ 50ml",
    flashPrice: "49.000₫",
    originalPrice: "129.000₫",
    discountPercent: 62,
    soldCount: 89,
    maxStock: 150,
    limitPerBuyer: 2,
    href: "/san-pham/kem-chong-nang-spf50",
  },
  {
    id: "deal-4",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlSnZ3bU5wG0tKeL8qO4pR6yC9fN7wK2iS9xT4vB3eF6hI0jK2lM1",
    imageAlt: "Sữa rửa mặt cấp ẩm",
    name: "Sữa rửa mặt cấp ẩm chiết xuất trà xanh 100ml",
    flashPrice: "69.000₫",
    originalPrice: "159.000₫",
    discountPercent: 57,
    soldCount: 203,
    maxStock: 300,
    limitPerBuyer: 2,
    href: "/san-pham/sua-rua-mat-chiet-xuat-tra-xanh",
  },
  {
    id: "deal-5",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuEmUoA4cV6xH1uLfM9rP5qS7zB0fO8xK3iT6yV4wC2eG5hJ1kK3lN2",
    imageAlt: "Tinh dầu thơm phòng",
    name: "Tinh dầu thơm phòng hương lavender 50ml",
    flashPrice: "39.000₫",
    originalPrice: "99.000₫",
    discountPercent: 61,
    soldCount: 134,
    maxStock: 180,
    limitPerBuyer: 2,
    href: "/san-pham/tinh-dau-thom-phong",
  },
];

// ─── Voucher tickets ─────────────────────────────────────────────────────────

export interface VoucherTicket {
  id: string;
  type: "discount" | "freeship";
  amount: string; // "50K" | "100K" | "FREESHIP" | "15%"
  label: string;
  subtitle: string;
  minOrder: string;
  expiresAt: string; // "31/10"
}

export const VOUCHER_TICKETS: VoucherTicket[] = [
  {
    id: "v-1",
    type: "discount",
    amount: "50K",
    label: "Giảm 50K",
    subtitle: "Đơn tối thiểu 299K",
    minOrder: "299K",
    expiresAt: "31/10",
  },
  {
    id: "v-2",
    type: "discount",
    amount: "100K",
    label: "Giảm 100K",
    subtitle: "Đơn tối thiểu 500K",
    minOrder: "500K",
    expiresAt: "31/10",
  },
  {
    id: "v-3",
    type: "freeship",
    amount: "FREESHIP",
    label: "Freeship Xtra",
    subtitle: "Giảm 30K ship từ 150K",
    minOrder: "150K",
    expiresAt: "31/10",
  },
  {
    id: "v-4",
    type: "discount",
    amount: "15%",
    label: "Giảm 15%",
    subtitle: "Đơn tối thiểu 1 triệu",
    minOrder: "1 triệu",
    expiresAt: "31/10",
  },
];

// ─── Featured stores ─────────────────────────────────────────────────────────

export interface FeaturedStore {
  id: string;
  initial: string; // avatar initial letter
  initialColor: string; // token color class
  name: string;
  verified: boolean;
  rating: number;
  followers: string; // formatted "12,3k"
  thumbnails: string[];
}

export const FEATURED_STORES: FeaturedStore[] = [
  {
    id: "store-1",
    initial: "A",
    initialColor: "text-primary",
    name: "Anker Official Store",
    verified: true,
    rating: 4.9,
    followers: "12,3k",
    thumbnails: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDi-h9lcBhuN7yT_-tUlT-Ep5Og86_1m5n7TQdds8uAWEa9eCSV4vb45eOqynxoWrmQxUq8a8bie2qZ2ARq33TxyqTDYLvHgSODDu2sYH7TiDjNerMOVimXhAxMWEw-Mj2G4RkFKNpYKGK4SM1noT_WnlqyDLUDPJa4ca3-iFh1RuxyaCr80vNVOJNwvC8oZ8fR9eIGcZAmpIgnModTZSS9Itt1pfPbaA696h4onllL4_tUjsmN3sMRUg",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB1d0R-ONEyqzumi1ixI8uaQW0N9vYp6eipRDYPpQVubGxt7QTJg35NEEOTJ6JH0aVt5Gv5gIwaIVf89uCgp4979jBUWIv6JNpD3NwFgBuat0c_hebKtaWaKZ6_cFZ4pvshRFQD0lDtvQDlKc1kdMT89pF1SDF_W1b35nIr5x5OBro4dgbTaljdxloGkGm4KquoCCTdEzRXVtXAmmpyibjGdFriHnVSCHPYDvB_WTlCaOfLAdE7k-0naA",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDlwcf2J98_GH_ybhqTcd_672d0u_V1nENQrWEjW6VPMX0kjl7NuHdAL6k1t8L87fWr4ToQaZTjcUEoQvKrUkAXvLOHoHIy-5DXVS1bnSgdmyX2sE1uuN6sDV08eni6cXEvI-Vp6UrFy4N3QEs6uPflHKMoHuRFM57cuDp4c_VEKU7JympXeljG0GF40AAhu-u9LSABNhrSRqL663Rbrshagp6Y3aXNfUlxh1N5agg6QeUZwdjYU_dcrA",
    ],
  },
  {
    id: "store-2",
    initial: "U",
    initialColor: "text-secondary",
    name: "Unilever Mall",
    verified: true,
    rating: 4.9,
    followers: "98,5k",
    thumbnails: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAm7805yiWBoOXJPaWLeSnOSw7j2BPo-yMsDOYnH83Qk278W2fNWN1vIFMNjaVDojOQuBJV_rcsRr_xIRe9xrCGb6pleNK9Vn_yX_U81E957EpAm1uddV9zCII9IboL_YYOW14wKv1ImiH0wq7fSJi7CvRbLYgywYMItWxCGZqHR5b101jtB8-QRZi29pqanaEzfqQccbGeKuvf17_wFwPxMfJEijCSRrcdyzuuz3W0BKSBit8yoa4mbA",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuApbwYxgLKzZQA_g7IpGyLmvQkdCtb3YN1BglbgGahVTQ_pQymZQSk4quNZ2oa6L6KR3t9Vm4aBAqIDXBNlJ-OeHJtpr9tH5UvoTDHc2wLkLKKcDyqPE4DFHEt4ApRqakhFPaZwTjK6Bh2El6rCnTm3V_Nhh86j7IzHppOJLRnrohJBTmiSZU8EQMHAyFG4N45ed4QhbMVS5gsYdT4ZHPS8p76aaf31qGmDvz3XUAB_QMMrHbXiRMdlTw",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0h85nrvq0eMTGfQ1iPr7Cws9Wcx-jFwh_v1FwLJqkPyo_fnF5Jisg3ya5EGju-c8knz-e8r4lTCwPv89ut7UmmRGRw8abowCcIHJsWxWq6c3hz3N8Lhe8Bv3K0R4cVVp5IR3GXNIVbBTfKk6mC3gNcKSwhc95XqMpPQfA9bPs5E9CY85AXUu_L80Ew70zCnzFulhzDCu-pWM945NjjB2x6Lkv_VGWp4vxitC59Vz6X0TaFCr9HqcMNw",
    ],
  },
  {
    id: "store-3",
    initial: "S",
    initialColor: "text-primary",
    name: "Samsung Official Store",
    verified: true,
    rating: 4.8,
    followers: "45,2k",
    thumbnails: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuEQ9f0H3I5vK1uMjP6rN3oS8zB1fP7xL2iT5wV3aD1eG4hJ0kK2lN3",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuFR0g1I4vL2wNjNkP7qO4pS9zC2fQ8yM3iT6wV4aE2dH5iK0jK1lL4",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuGS1h2J5wM3xOkOlQ8rP5tT0zD3fR9zN4iT7wX5aF3eI6jK0kK2lM5",
    ],
  },
  {
    id: "store-4",
    initial: "A",
    initialColor: "text-secondary",
    name: "Adidas Official",
    verified: true,
    rating: 4.7,
    followers: "28,7k",
    thumbnails: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuHT2i3K6wN4yPlPmR9sQ6uU1zE4fS0aO5iT8wX6bF4eI7jK0kK3lN6",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuIU3j4L7xO5zQmQnT0tR7vV2zF5fT1bP6iT9wX7cG5fJ8kK0kK4lO7",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuJV4k5M8yP6aRnRoU1uS8wW3zG6gU2cQ7iT0wX8dH6gK9kK0kL5lP8",
    ],
  },
];

// ─── Recommended products ─────────────────────────────────────────────────────

export interface RecommendedProduct {
  id: string;
  imageUrl: string;
  imageAlt: string;
  name: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  rating: number;
  soldCount: string;
  location: string;
  voucherLabel?: string; // e.g. "Giảm 10K"
  href: string;
}

export const RECOMMENDED_PRODUCTS: RecommendedProduct[] = [
  {
    id: "rec-1",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHNiVbTE9VQEnwcMuRFnUiCqw8bctm-0Aoc8CQxxC3KHnanY3pgSA1mmENDurECrPNRAedzMxmu3zxsEiGXBQkzP64JPTAkclPO77RY_-2roK1eRfvzgEzt-dI7wf3mEtPXTX2mrWbqFVrKMOwEGQFnTBoU5N1zQ_8wcb6GSrgxUkVTyQYy9fJqV-h-hVXoEczDkL8rqt5fwMvqnUhgbqlYtfYwsLAuxFlBvg51ofmBalKufhMygwOPQ",
    imageAlt: "Tai nghe chụp tai gaming khử tiếng ồn ANC",
    name: "Tai nghe Bluetooth không dây chụp tai chống ồn chủ động ANC thế hệ mới",
    price: "389.000₫",
    originalPrice: "520.000₫",
    discountPercent: 25,
    rating: 4.8,
    soldCount: "1,2k",
    location: "Hà Nội",
    href: "/san-pham/tai-nghe-gaming-anc",
  },
  {
    id: "rec-2",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCdL6jUKSfY2qixtPLqmMImrAHL9Lc_Jce27OcqF1PUvbdTUgTAg0UzQYzo89Tx4ypHTbTziCD_HWXEQ8WlehBcKinb17qwz8MtCM-I86HXERvDzhqDPiXDmnrkkpSZdv_Mrl61fR6eDdSr9woUV3U2KOezVVUb6xKxtqVQUfUMY99NYBzkiB4IpjccPTZIsPaB0Lced-pBunKF0_jjOzQHu5OD5mZTzBWh4nhWlWY2SqphRxGRJsKaA",
    imageAlt: "Balo du lịch chống nước ngăn laptop",
    name: "Balo thời trang đa năng chống thấm nước cao cấp đựng vừa laptop 15.6 inch",
    price: "245.000₫",
    rating: 4.9,
    soldCount: "3,8k",
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Giảm 10K",
    href: "/san-pham/balo-chong-nuoc",
  },
  {
    id: "rec-3",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0G3Z0J5OAw0CUjqAmrCitZeVCBuR4O2vpgPNYojf6PtyROZvdPbyHMmMEYd4pg7vxVno-niwiq3_l26PCPtwXKZb19SwplHQZboRcmKoW16Z8VaPZrtt8ddCW4ZeQ1qh6t6_Ii_DuwFK3g8qoCbbISOx4QaFq-qkT02uLqpm6650Z0bWmr3TiTxR7ZcB5zRhc11cb4JzDv0TEev-MVHW-Do_Y__z5R-xhTee6qyqHW8g1kQTAbbdyGQ",
    imageAlt: "Chuột không dây Silent công thái học 2.4GHz",
    name: "Chuột không dây Silent công thái học 2.4GHz kết nối Bluetooth đa thiết bị",
    price: "179.000₫",
    rating: 4.7,
    soldCount: "890",
    location: "Đà Nẵng",
    href: "/san-pham/chuot-khong-day",
  },
  {
    id: "rec-4",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4ptDnHSJRCSDhp3Y4b_L8RA0TCnqXO-Tvg3pshPtHggVFtawsbVE750AJvvtVwB3-n0iGILkHw-IKe5o1OH-edlq8fPKMkqbHNLXXT3uhMF6cTapl8A4GMkk3FRS7PSf6ubF2qMDiS76MH5OIlKKWVaMf1incXA1p3GiLC0lrnztUcz4krOavL2QbjgGnJLGI5o8yAwLRj3PXYIWcre8JdyTRbc0vOJKZRTHj_KvjTm3XFyrAeKV7uQ",
    imageAlt: "Bàn ủi hơi nước cầm tay nhỏ gọn du lịch",
    name: "Bàn ủi hơi nước cầm tay gấp gọn tiện lợi công suất 1200W",
    price: "310.000₫",
    rating: 4.8,
    soldCount: "2,1k",
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/san-pham/ban-ui-hoi-nuoc",
  },
  {
    id: "rec-5",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDR0zUIqhjLEV_LxGVWf_1Bt7aqnALxrKZAeocuHZAf68aij0ifjHgujG4WaOQh5yy8zWc2kAaSC2prpWeHCtW_RSGXVlK8fviY3GWKK5hdssEOqXafDnhW-G0cPKCPciGeYwDHP25e-4FelVeFPqYFV_wM-D98wa4Kj-ZIPhimRQWB1HNZmPt8HU-yroOLSD3yujybMV5AWosUQLiYV7_ZKUmQzLB64qSCx7lvhbdfW5YZQJqqeT4x4A",
    imageAlt: "Giá đỡ hợp kim nhôm để bàn",
    name: "Giá đỡ hợp kim nhôm để bàn điều chỉnh độ cao xoay góc linh hoạt",
    price: "89.000₫",
    originalPrice: "105.000₫",
    discountPercent: 15,
    rating: 4.9,
    soldCount: "5,6k",
    location: "Hà Nội",
    href: "/san-pham/gia-do-nhom-ban",
  },
  {
    id: "rec-6",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXUJ1RHx0MyeQgGWydvQHdEieyFuL0rbNAp5I3e5Lr9ch2vDZq-N7HNRNvuOI_VVKwTvvwr0RbVWeqZTPDHwR2UUwtLLU1q7skcKWBhvNRaShB3Yy-eE08m7O4yhjZz_JFOlK-eKcPjS0QD2OFfmrjqhOslDmLEMIjkmJfxKtAE1RbFQQfc_mX3P62P-ZKLbF_hucLD6mYapFqQkTjczCLl_vfVrlsk_Q55yXH1n5TT7wK01yZ_FwCWw",
    imageAlt: "Đèn bàn học chống cận thị LED",
    name: "Đèn bàn học chống cận bảo vệ mắt cảm ứng dimmer tăng giảm sáng thông minh",
    price: "199.000₫",
    rating: 4.8,
    soldCount: "950",
    location: "Hà Nội",
    href: "/san-pham/den-ban-hoc-chong-can",
  },
];
