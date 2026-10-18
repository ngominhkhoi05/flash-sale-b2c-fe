/**
 * Search feature – mock data (mirror Stitch "tai nghe bluetooth" 20 sản phẩm).
 *
 * Items use `RecommendedProductResponse` shape (cùng với BE
 * `GET /api/v1/products/search` response) để FE render ProductCard trực tiếp
 * qua `mapToProductCardProps`.
 *
 * Stitch reference: docs/superpowers/handoffs/tim-kiem-san-pham.md (20 cards)
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan A)
 * Plan: docs/superpowers/plans/2026-10-18-search-endpoint-be-wire-fe.md
 */

import type { RecommendedProductResponse } from "@/features/homepage/api";
import type { SearchFacets, SearchMall, SearchResult } from "./types";

/* ──────────────────────────────────────────────────────────────
 * 20 sản phẩm (mirror Stitch, deduped với mockProductDetail)
 * ────────────────────────────────────────────────────────────── */
export const MOCK_SEARCH_ITEMS: RecommendedProductResponse[] = [
  {
    id: 101,
    storeId: 1,
    storeName: "Sony Audio Official Store",
    name: "Tai nghe Bluetooth Sony WF-C500 Chính Hãng DSEE Chống nước IPX4",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBS7uJivvwgryvfl2fNrw9XP3t22OAkba1lRcUza2LG_qK7WawjEDPImF8QihPM5q-hv3m3RkxSjDzVnt_lHtNe08HMKP-Ff674t5TIg99d6VS56b0O2nQYxU0ePxXxnh3vLUBIF9Yo4ffIPk4zcJD0tJEyWZS_7NXrCdw-4Rye-KqQOizymrO185fGTZzwXbM-aRK2AafNaQYWIoazeXEaot76uOeSA3IlrvddhiHIvh-R3lRilrCNtg",
    minPrice: 990000,
    maxPrice: 1520000,
    totalStock: 100,
    totalSold: 1800,
    label: "freeship",
  },
  {
    id: 102,
    storeId: 2,
    storeName: "Anker Official Store",
    name: "Tai nghe Anker Soundcore Space A40 Chống ồn chủ động ANC 50H",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDKYp0m-39q0C-vfIQ7OvubK4JnB15m1B4P-lKmF95KdyLW5isIwKWvxtY0w8uI1-zRtZRs5A0-dpa0xrJjITC824QlO2dSROmvsAg9HceIwZ9-FbvnhP-GbI4OVxsrSjSdML_fucqiVzTRiMguM0t2389ZuiIOF-hlVZRNDJ6ekQIvm0aNbcKL9fUxmIkpXbb4_i1lESrlxSBM2woSvAv-08vSuiRj55651iQ5ayfzH5mco1ObnooKYA",
    minPrice: 1390000,
    maxPrice: 2300000,
    totalStock: 80,
    totalSold: 3400,
    label: "voucher",
  },
  {
    id: 103,
    storeId: 3,
    storeName: "Baseus Flagship Store",
    name: "Tai nghe không dây Baseus Bowie M2+ Chống ồn Hybrid ANC -42dB",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGlXRZse05EKNrvLdW4P20rfHPSmdM1qbBBaAfbWYyb3ZECoIq4RXVXpA36rSMjd-iTey4SAUkxFGlv93-APhqyPwexxtW7AkSxiXG-Dc4TfkcfmCdpLWmO0Es_UxH3IIllAg6gBH64IurOU0FRs5SfG-31LhvOUyL_kadKeXccLRVYSFOJH18zevufog7Rx-O2S0bPhLyOLGmEGTYE1tRJ9AEGqhV21pPhgVs5C1iyK9PZyOuORCFuw",
    minPrice: 649000,
    maxPrice: 1299000,
    totalStock: 200,
    totalSold: 5200,
    label: "freeship",
  },
  {
    id: 104,
    storeId: 4,
    storeName: "Marshall Audio VN",
    name: "Tai nghe Bluetooth Marshall Minor III Âm Bass Mạnh Mẽ Retro",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJayQPfFDOfijOP6zo0limreMsKdOvOz2SXwKEWHooeDwF-lERerB0S5Q2N8zEJvGNZS0aIKWGblk7LXKTc9oCEl1acI3I9UzdgTSjs1cQgg_YMnYFntllSA2X3J5SCCw4W65mzGNpOIycJmNyANwp_vBUZTHvLGDq0COc6btQnWURu2cT0csjvbCDnka6ZficU43eMLlOX4AaQXCnLybjsmCZzfDjwPJqZ_wm1lf9LnOzekkXp8KQJw",
    minPrice: 2450000,
    maxPrice: 3400000,
    totalStock: 50,
    totalSold: 890,
    label: "freeship",
  },
  {
    id: 105,
    storeId: 5,
    storeName: "JBL Vietnam Store",
    name: "Tai nghe Bluetooth JBL Wave 200TWS Âm Thanh Deep Bass Quốc Tế",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNMaMTGtWBQtj1_UGHcK-BlV6HGfNge5jR5WzeMprFHMz1noio4BpRUY7mvLmLbP6V9VmYGiALBL2IgAZcw5jIvTjMJr7a1BwaYYM9IXumktLKX68uiPI1ELGwLEcCGLk--QOTP3QsPBmW-gChKIJviVeQ5iMjjGneoc182amuCif0MbRHZplF84Ubi-LphtgtFVrNh3xyMKYMadWVDTA0OTZbcSZaqiM8bkmt1T8GQTW-bNlOV7_aNQ",
    minPrice: 799000,
    maxPrice: 1450000,
    totalStock: 150,
    totalSold: 4100,
    label: "freeship",
  },
  {
    id: 106,
    storeId: 6,
    storeName: "HAVIT Store",
    name: "Tai nghe Bluetooth HAVIT TW967 Bluetooth 5.3 Pin Trâu 20H Type-C",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB0a9pqh0RSVA4_TKvIUtfbuENjL5z8oPYj2VVP_FR_w57odk4q0w-DGwazfbAZzDGSlg8444htlbdmFoSm_2opi70GDi3rtewUz-wkgViY5z9D1K-iZBF3OJaxaboiDcn4YJ_nmBdxJSMtAeXqIUB5EmM8dvanNv7Wk9NEWndPrt_cMfgAB4Y3tEWUOalO1W_RrexwHpOkHx0Mx1C6r4YxHFFr40D5_Bmo172BfM3gTqZiLFq-DjLfpg",
    minPrice: 239000,
    maxPrice: 499000,
    totalStock: 300,
    totalSold: 11200,
    label: "voucher",
  },
  {
    id: 107,
    storeId: 7,
    storeName: "SoundPEATS VN",
    name: "Tai nghe SoundPEATS Air4 Pro Snapdragon Sound Chống Ồn Cao Cấp",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBlwzlKlw0eLrAiLbUWEZMIXuWzG0XnJ68Fs6uh3Zy0anjIxodH4yRImzcXmniTl_jmdYFk-7NFVM1nx_OcUNbbnlmBNKPX2E1nnlCYYh900V4ZFPsnxCEWsnzuLFlbeohof_y8IPbZMeejvEJ6k7UXomNoKritQvQCPflrM07wadaF_8pPoBJsQV5bTA_SHNiFp2HmW-gJGeFGqIeHOb4SInCT8nk72pqSuMvw4rMHRqciZP2rANhvCA",
    minPrice: 1190000,
    maxPrice: 1700000,
    totalStock: 70,
    totalSold: 2100,
    label: "freeship",
  },
  {
    id: 108,
    storeId: 8,
    storeName: "Edifier Vietnam",
    name: "Tai nghe chụp tai Edifier W820NB Plus Hi-Res Audio Chống Ồn 43dB",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuD_6qxyhLNw9SU7ICjVjf6VCUsC7ZTfCg91_9H4I_uLFypm-fIyzSsQGNP4WNsm_3J4I2YJsM5feesB0UtR1woWmxMBx7TjR_v6gOnR0i5t3tptTO8LYOXMi3tvgUa9A0cmTGV8dQZO50yXc-Mu5trFZoKW0n1jQWyL6Ey1FC9tLGccEGmcziOjgE8_S9af6CleO183IC48MWSLlcCV4mIJdvj9j0ft10LeZWriYpkXoDiQgKtB4sxw",
    minPrice: 1049000,
    maxPrice: 1399000,
    totalStock: 90,
    totalSold: 1500,
    label: "freeship",
  },
  {
    id: 109,
    storeId: 9,
    storeName: "QCY Official",
    name: "Tai nghe không dây QCY T13 ANC 4 Mic Lọc Tiếng Ồn Siêu Rõ",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCQiU2EGsTMfnREOenqmLjwhPw63YXhhtHJS0C12esqotbhzCrQDwcwaVTehLLUOTv2V3SiX193EAzKLp48OTgkUsyR_zKMwcpHVYD8EVJHN2vMvNbBuQ-u5cEBFhL0xdH7u61EiJGd5v_cZc_Dck0XwmbaAVanQpGjO_YBMZZmgVsSpC5RZDDb7ymm20lox8sSBK-RET4oZTthUKRbVXRcPfI-uFKJ2yRXxKnaa5q0yaxD7rBFTPN62A",
    minPrice: 369000,
    maxPrice: 640000,
    totalStock: 400,
    totalSold: 7800,
    label: "freeship",
  },
  {
    id: 110,
    storeId: 10,
    storeName: "Samsung Audio VN",
    name: "Tai nghe Samsung Galaxy Buds2 Chống Ồn Chủ Động Thông Minh AKG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8IpG8AsLYe9k7Oj1G5Q5rQfft3TwK7yjOdcOHYrs1SpLwcQ_QqfgEovGJyPT-quvCsn9Ug_hiOvW4w2T8jniirnm7gdhtIdsPMX3Urzg2bz1V-5hguVIvmsEkHWub0xcMwhH2FrYUz_gorDiuXv06p-bsxux0Xb4spn9732JET8Pn2ykAb9jGTTW57iVH6nvJjeEvx44v6m48Qz3w8VbnOZZBsT-MJB6rmdskt2z9DlEfHgyq5pvi9Q",
    minPrice: 1490000,
    maxPrice: 2890000,
    totalStock: 120,
    totalSold: 3600,
    label: "freeship",
  },
  {
    id: 111,
    storeId: 2,
    storeName: "Anker Official Store",
    name: "Tai nghe Anker Soundcore Life P2i Âm Bass Chắc 2 Chế Độ EQ",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDCCJ2C7cGshZV7Fuo7OInYo4rsMSij8wprHHEN0ZhLkFErs4akdpDmwZT_-ZsKQfidTmsDFGbf1zVz4fbneqpne3mcgbYbExUj9tXQ8_g9egt3sRQhjbBi1iJXfSmAvuFBdbtx1n-kec57SHMfyHr6gSTqQA6QCG8ZKRjbB-h_xNfBk331vHs6bUGiVH1P5NT37RnhXOIEAWNCOJWAxmTEdOCorLy_acpkkgHTeNd7dAPZs51BqwyrbQ",
    minPrice: 490000,
    maxPrice: 790000,
    totalStock: 250,
    totalSold: 4900,
    label: "freeship",
  },
  {
    id: 112,
    storeId: 11,
    storeName: "Lenovo Audio VN",
    name: "Tai nghe Bluetooth Lenovo Thinkplus LP40 Pro Game Lag Cực Thấp",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCqn-m63qG1aOFR5Qh8TGCo_QyPr_hK15EBwOVS-hQpWvDN2u0qIGz0SG1ZvrkZXKFQ4COriet-sE2mHrkiF7mIhRYVaaFRzohrT3WcbCxEJE_5v34eO0AMjlgha0kOCCUbFFqvQ6r69opANzaatksPoWSatta0PpNoYQOyr8qlYMbAhXT30q2SHq2daDaLrpMyjYK98sPpbm9iwNGK2oPo6RG8H1ClEA_UOPAJgg_OXJJzGicPj4fn5Q",
    minPrice: 219000,
    maxPrice: 490000,
    totalStock: 500,
    totalSold: 16500,
    label: "freeship",
  },
  {
    id: 113,
    storeId: 12,
    storeName: "EarFun Vietnam",
    name: "Tai nghe Bluetooth EarFun Air Pro 3 Chống Ồn ANC aptX Adaptive",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAFtotfcArvcvhyfFAVhYmOtNpf3IRVC514pF5byIo5ja7ieK3VFdfocjAGq8W-vYN79NUsBwCT7LDqO-5mY7Tquv6wGG9V2nlqYs7ZO8US1au0Woj5ptaoIk_jWZjerluUBbmU605jPIabVZEpJQqjfiiXiwlIOz_g8b96lwVW5sp01q59VRoRrUioSdL8Y1Vi2UE07AGaZKew9yZV-3RFs8i0zDT0I9eCOQKVC4mOjFf5eY_1aHkpJw",
    minPrice: 1290000,
    maxPrice: 1890000,
    totalStock: 75,
    totalSold: 2300,
    label: "freeship",
  },
  {
    id: 114,
    storeId: 13,
    storeName: "Xiaomi Audio VN",
    name: "Tai nghe True Wireless Xiaomi Redmi Buds 5 Pro Pin 38 Giờ",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGlXRZse05EKNrvLdW4P20rfHPSmdM1qbBBaAfbWYyb3ZECoIq4RXVXpA36rSMjd-iTey4SAUkxFGlv93-APhqyPwexxtW7AkSxiXG-Dc4TfkcfmCdpLWmO0Es_UxH3IIllAg6gBH64IurOU0FRs5SfG-31LhvOUyL_kadKeXccLRVYSFOJH18zevufog7Rx-O2S0bPhLyOLGmEGTYE1tRJ9AEGqhV21pPhgVs5C1iyK9PZyOuORCFuw",
    minPrice: 1090000,
    maxPrice: 1990000,
    totalStock: 200,
    totalSold: 6800,
    label: "voucher",
  },
  {
    id: 115,
    storeId: 14,
    storeName: "Defunc VN",
    name: "Tai nghe không dây Defunc True Basic Âm Thanh Sống Động",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBS7uJivvwgryvfl2fNrw9XP3t22OAkba1lRcUza2LG_qK7WawjEDPImF8QihPM5q-hv3m3RkxSjDzVnt_lHtNe08HMKP-Ff674t5TIg99d6VS56b0O2nQYxU0ePxXxnh3vLUBIF9Yo4ffIPk4zcJD0tJEyWZS_7NXrCdw-4Rye-KqQOizymrO185fGTZzwXbM-aRK2AafNaQYWIoazeXEaot76uOeSA3IlrvddhiHIvh-R3lRilrCNtg",
    minPrice: 399000,
    maxPrice: 500000,
    totalStock: 60,
    totalSold: 1100,
    label: "freeship",
  },
  {
    id: 116,
    storeId: 15,
    storeName: "Shokz VN",
    name: "Tai nghe Bluetooth thể thao Shokz OpenMove Truyền Âm Qua Xương",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuD_6qxyhLNw9SU7ICjVjf6VCUsC7ZTfCg91_9H4I_uLFypm-fIyzSsQGNP4WNsm_3J4I2YJsM5feesB0UtR1woWmxMBx7TjR_v6gOnR0i5t3tptTO8LYOXMi3tvgUa9A0cmTGV8dQZO50yXc-Mu5trFZoKW0n1jQWyL6Ey1FC9tLGccEGmcziOjgE8_S9af6CleO183IC48MWSLlcCV4mIJdvj9j0ft10LeZWriYpkXoDiQgKtB4sxw",
    minPrice: 1590000,
    maxPrice: 2490000,
    totalStock: 40,
    totalSold: 980,
    label: "freeship",
  },
  {
    id: 117,
    storeId: 1,
    storeName: "Sony Audio Official Store",
    name: "Tai nghe chụp tai Sony WH-CH520 Pin 50 Giờ Kết Nối Đa Thiết Bị",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCoePQC_nLCeERga7RWn-38gTyLgRAZSxMJFftr2SfvFz_S3LtLMZJivqqRhQlXl3nKxoZloc-_WWxDHeQ0Mty7OMxIHHejckCzK3r0t4KT3fELTOiNNTt3qSOK_YHQg2Uo08Ky1SPzVbtp2eWGTq-UliEN7Dz57optKMkhSBCbjWG5dvJ09BJFfLCMzshDFxpRSjZ65a4ZMqbSHakha_n0IY6wyp7aMn37jJ-M5pvo6Gv2vcc_ERcsKw",
    minPrice: 890000,
    maxPrice: 1590000,
    totalStock: 180,
    totalSold: 5400,
    label: "voucher",
  },
  {
    id: 118,
    storeId: 16,
    storeName: "Beats Vietnam",
    name: "Tai nghe Bluetooth Beats Studio Buds Chống Ồn Chủ Động",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBlwzlKlw0eLrAiLbUWEZMIXuWzG0XnJ68Fs6uh3Zy0anjIxodH4yRImzcXmniTl_jmdYFk-7NFVM1nx_OcUNbbnlmBNKPX2E1nnlCYYh900V4ZFPsnxCEWsnzuLFlbeohof_y8IPbZMeejvEJ6k7UXomNoKritQvQCPflrM07wadaF_8pPoBJsQV5bTA_SHNiFp2HmW-gJGeFGqIeHOb4SInCT8nk72pqSuMvw4rMHRqciZP2rANhvCA",
    minPrice: 2190000,
    maxPrice: 3090000,
    totalStock: 60,
    totalSold: 1400,
    label: "freeship",
  },
  {
    id: 119,
    storeId: 7,
    storeName: "SoundPEATS VN",
    name: "Tai nghe True Wireless Soundpeats Clear Trong Suốt Gaming",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCqn-m63qG1aOFR5Qh8TGCo_QyPr_hK15EBwOVS-hQpWvDN2u0qIGz0SG1ZvrkZXKFQ4COriet-sE2mHrkiF7mIhRYVaaFRzohrT3WcbCxEJE_5v34eO0AMjlgha0kOCCUbFFqvQ6r69opANzaatksPoWSatta0PpNoYQOyr8qlYMbAhXT30q2SHq2daDaLrpMyjYK98sPpbm9iwNGK2oPo6RG8H1ClEA_UOPAJgg_OXJJzGicPj4fn5Q",
    minPrice: 349000,
    maxPrice: 699000,
    totalStock: 300,
    totalSold: 8200,
    label: "freeship",
  },
  {
    id: 120,
    storeId: 4,
    storeName: "Marshall Audio VN",
    name: "Tai nghe Bluetooth Marshall Major IV Sạc Không Dây Pin 80H",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJayQPfFDOfijOP6zo0limreMsKdOvOz2SXwKEWHooeDwF-lERerB0S5Q2N8zEJvGNZS0aIKWGblk7LXKTc9oCEl1acI3I9UzdgTSjs1cQgg_YMnYFntllSA2X3J5SCCw4W65mzGNpOIycJmNyANwp_vBUZTHvLGDq0COc6btQnWURu2cT0csjvbCDnka6ZficU43eMLlOX4AaQXCnLybjsmCZzfDjwPJqZ_wm1lf9LnOzekkXp8KQJw",
    minPrice: 2890000,
    maxPrice: 4450000,
    totalStock: 50,
    totalSold: 1900,
    label: "freeship",
  },
];

/* ──────────────────────────────────────────────────────────────
 * Facet (sidebar filter counts) — derive từ items
 * ────────────────────────────────────────────────────────────── */
export const MOCK_SEARCH_FACETS: SearchFacets = {
  subcategories: [
    { key: "true-wireless", label: "Tai nghe True Wireless", count: 420 },
    { key: "over-ear", label: "Tai nghe chụp tai Over-ear", count: 310 },
    { key: "sport-waterproof", label: "Tai nghe thể thao chống nước", count: 180 },
    { key: "gaming-mic", label: "Tai nghe gaming có mic", count: 215 },
    { key: "accessories", label: "Phụ kiện & ốp tai nghe", count: 123 },
  ],
  cities: [
    { key: "HCM", label: "TP. Hồ Chí Minh", count: 824 },
    { key: "HN", label: "Hà Nội", count: 312 },
    { key: "DN", label: "Đà Nẵng", count: 78 },
    { key: "BD", label: "Bình Dương", count: 34 },
  ],
  ratings: [
    { key: "5", label: "5 sao tuyệt đối", count: 642 },
    { key: "4", label: "Từ 4 sao trở lên", count: 1180 },
    { key: "3", label: "Từ 3 sao trở lên", count: 1218 },
  ],
  services: [
    { key: "flash-sale", label: "Đang Flash Sale", count: 0 },
    { key: "voucher", label: "Voucher giảm giá", count: 0 },
    { key: "freeship", label: "Freeship Xtra", count: 0 },
    { key: "official", label: "Hàng chính hãng 100%", count: 0 },
  ],
};

/* ──────────────────────────────────────────────────────────────
 * Mall banner (Sony — luôn hiển thị theo Stitch, BE sẽ dynamic sau)
 * ────────────────────────────────────────────────────────────── */
export const MOCK_SEARCH_MALL: SearchMall = {
  storeId: "sony-audio-store",
  name: "SONY Audio Official Store",
  initials: "SONY",
  rating: 4.9,
  ratingCountLabel: "12.4k đánh giá",
  responseRate: 99,
  productCount: 148,
  badgeLabel: "MALL",
  isOfficial: true,
  highlights: [
    {
      id: "mall-wf-c500",
      name: "WF-C500",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAFtotfcArvcvhyfFAVhYmOtNpf3IRVC514pF5byIo5ja7ieK3VFdfocjAGq8W-vYN79NUsBwCT7LDqO-5mY7Tquv6wGG9V2nlqYs7ZO8US1au0Woj5ptaoIk_jWZjerluUBbmU605jPIabVZEpJQqjfiiXiwlIOz_g8b96lwVW5sp01q59VRoRrUioSdL8Y1Vi2UE07AGaZKew9yZV-3RFs8i0zDT0I9eCOQKVC4mOjFf5eY_1aHkpJw",
      imageAlt: "Sony WF-C500",
      price: 990000,
    },
    {
      id: "mall-wh-1000xm5",
      name: "WH-1000XM5",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCoePQC_nLCeERga7RWn-38gTyLgRAZSxMJFftr2SfvFz_S3LtLMZJivqqRhQlXl3nKxoZloc-_WWxDHeQ0Mty7OMxIHHejckCzK3r0t4KT3fELTOiNNTt3qSOK_YHQg2Uo08Ky1SPzVbtp2eWGTq-UliEN7Dz57optKMkhSBCbjWG5dvJ09BJFfLCMzshDFxpRSjZ65a4ZMqbSHakha_n0IY6wyp7aMn37jJ-M5pvo6Gv2vcc_ERcsKw",
      imageAlt: "Sony WH-1000XM5",
      price: 6990000,
    },
    {
      id: "mall-linkbuds-s",
      name: "LinkBuds S",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAEJaCLS2pbyGJP-TeidYrPqqUgrBReuN_9nUo8nM8CMpJwAPQviEbZHlaqWRPxnofNuF0m_BSNSKYjeYTq-UGN5IBZ-1wb2DXOg5rLSe4PXNddf7VrMNwXk8yWJw3nrpocGRU9_iNWhVqrjrXu7Uj9WgS0ybHmb774Q2990NUGEmQB67VrTzHFCIroerOVs_DulS0UbbUy4dDoGsf2pBt1Y1EDKohi0zhj1FFQOYvk-CdVWYMvAfP6Kw",
      imageAlt: "Sony LinkBuds S",
      price: 2890000,
    },
  ],
};

/* ──────────────────────────────────────────────────────────────
 * Suggested keywords (empty state)
 * ────────────────────────────────────────────────────────────── */
export const MOCK_SUGGESTED_KEYWORDS = [
  "Tai nghe Apple AirPods",
  "Sony WH-1000XM4",
  "Tai nghe chụp tai Gaming",
  "Tai nghe không dây Type-C",
];

/* ──────────────────────────────────────────────────────────────
 * Top-level mock result — tổng hợp tất cả
 * ────────────────────────────────────────────────────────────── */
export const MOCK_SEARCH_RESULT: SearchResult = {
  items: MOCK_SEARCH_ITEMS,
  total: 1248,
  page: 1,
  pageSize: 20,
  facets: MOCK_SEARCH_FACETS,
  mall: MOCK_SEARCH_MALL,
};
