/**
 * Search feature – mock data (mirror Stitch "tai nghe bluetooth" 20 sản phẩm).
 *
 * Khi BE ready, xoá file này + sửa `api.ts` để gọi `apiFetch` thật.
 *
 * Stitch reference: docs/superpowers/handoffs/tim-kiem-san-pham.md (20 cards)
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan A)
 */

import type { RecommendedProduct } from "@/features/products/types";
import type { SearchFacets, SearchMall, SearchResult } from "./types";

/* ──────────────────────────────────────────────────────────────
 * 20 sản phẩm (mirror Stitch, deduped với mockProductDetail)
 * ────────────────────────────────────────────────────────────── */
export const MOCK_SEARCH_ITEMS: RecommendedProduct[] = [
  {
    id: "wf-c500",
    name: "Tai nghe Bluetooth Sony WF-C500 Chính Hãng DSEE Chống nước IPX4",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBS7uJivvwgryvfl2fNrw9XP3t22OAkba1lRcUza2LG_qK7WawjEDPImF8QihPM5q-hv3m3RkxSjDzVnt_lHtNe08HMKP-Ff674t5TIg99d6VS56b0O2nQYxU0ePxXxnh3vLUBIF9Yo4ffIPk4zcJD0tJEyWZS_7NXrCdw-4Rye-KqQOizymrO185fGTZzwXbM-aRK2AafNaQYWIoazeXEaot76uOeSA3IlrvddhiHIvh-R3lRilrCNtg",
    imageAlt: "Tai nghe Sony WF-C500 chống nước IPX4",
    price: 990000,
    originalPrice: 1520000,
    discountPercent: 35,
    rating: 4.8,
    totalSold: 1800,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/sony-wf-c500",
  },
  {
    id: "soundcore-a40",
    name: "Tai nghe Anker Soundcore Space A40 Chống ồn chủ động ANC 50H",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDKYp0m-39q0C-vfIQ7OvubK4JnB15m1B4P-lKmF95KdyLW5isIwKWvxtY0w8uI1-zRtZRs5A0-dpa0xrJjITC824QlO2dSROmvsAg9HceIwZ9-FbvnhP-GbI4OVxsrSjSdML_fucqiVzTRiMguM0t2389ZuiIOF-hlVZRNDJ6ekQIvm0aNbcKL9fUxmIkpXbb4_i1lESrlxSBM2woSvAv-08vSuiRj55651iQ5ayfzH5mco1ObnooKYA",
    imageAlt: "Soundcore Space A40 ANC",
    price: 1390000,
    originalPrice: 2300000,
    discountPercent: 40,
    rating: 4.9,
    totalSold: 3400,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Giảm 10K",
    href: "/products/soundcore-space-a40",
  },
  {
    id: "baseus-m2-plus",
    name: "Tai nghe không dây Baseus Bowie M2+ Chống ồn Hybrid ANC -42dB",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGlXRZse05EKNrvLdW4P20rfHPSmdM1qbBBaAfbWYyb3ZECoIq4RXVXpA36rSMjd-iTey4SAUkxFGlv93-APhqyPwexxtW7AkSxiXG-Dc4TfkcfmCdpLWmO0Es_UxH3IIllAg6gBH64IurOU0FRs5SfG-31LhvOUyL_kadKeXccLRVYSFOJH18zevufog7Rx-O2S0bPhLyOLGmEGTYE1tRJ9AEGqhV21pPhgVs5C1iyK9PZyOuORCFuw",
    imageAlt: "Baseus Bowie M2+ ANC",
    price: 649000,
    originalPrice: 1299000,
    discountPercent: 50,
    rating: 4.7,
    totalSold: 5200,
    location: "Hà Nội",
    voucherLabel: "Freeship",
    href: "/products/baseus-bowie-m2-plus",
  },
  {
    id: "marshall-minor-iii",
    name: "Tai nghe Bluetooth Marshall Minor III Âm Bass Mạnh Mẽ Retro",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJayQPfFDOfijOP6zo0limreMsKdOvOz2SXwKEWHooeDwF-lERerB0S5Q2N8zEJvGNZS0aIKWGblk7LXKTc9oCEl1acI3I9UzdgTSjs1cQgg_YMnYFntllSA2X3J5SCCw4W65mzGNpOIycJmNyANwp_vBUZTHvLGDq0COc6btQnWURu2cT0csjvbCDnka6ZficU43eMLlOX4AaQXCnLybjsmCZzfDjwPJqZ_wm1lf9LnOzekkXp8KQJw",
    imageAlt: "Marshall Minor III retro",
    price: 2450000,
    originalPrice: 3400000,
    discountPercent: 28,
    rating: 4.9,
    totalSold: 890,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/marshall-minor-iii",
  },
  {
    id: "jbl-wave-200",
    name: "Tai nghe Bluetooth JBL Wave 200TWS Âm Thanh Deep Bass Quốc Tế",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNMaMTGtWBQtj1_UGHcK-BlV6HGfNge5jR5WzeMprFHMz1noio4BpRUY7mvLmLbP6V9VmYGiALBL2IgAZcw5jIvTjMJr7a1BwaYYM9IXumktLKX68uiPI1ELGwLEcCGLk--QOTP3QsPBmW-gChKIJviVeQ5iMjjGneoc182amuCif0MbRHZplF84Ubi-LphtgtFVrNh3xyMKYMadWVDTA0OTZbcSZaqiM8bkmt1T8GQTW-bNlOV7_aNQ",
    imageAlt: "JBL Wave 200TWS",
    price: 799000,
    originalPrice: 1450000,
    discountPercent: 45,
    rating: 4.8,
    totalSold: 4100,
    location: "Đà Nẵng",
    voucherLabel: "Freeship",
    href: "/products/jbl-wave-200",
  },
  {
    id: "havit-tw967",
    name: "Tai nghe Bluetooth HAVIT TW967 Bluetooth 5.3 Pin Trâu 20H Type-C",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB0a9pqh0RSVA4_TKvIUtfbuENjL5z8oPYj2VVP_FR_w57odk4q0w-DGwazfbAZzDGSlg8444htlbdmFoSm_2opi70GDi3rtewUz-wkgViY5z9D1K-iZBF3OJaxaboiDcn4YJ_nmBdxJSMtAeXqIUB5EmM8dvanNv7Wk9NEWndPrt_cMfgAB4Y3tEWUOalO1W_RrexwHpOkHx0Mx1C6r4YxHFFr40D5_Bmo172BfM3gTqZiLFq-DjLfpg",
    imageAlt: "HAVIT TW967",
    price: 239000,
    originalPrice: 499000,
    discountPercent: 52,
    rating: 4.6,
    totalSold: 11200,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Giảm 10K",
    href: "/products/havit-tw967",
  },
  {
    id: "soundpeats-air4-pro",
    name: "Tai nghe SoundPEATS Air4 Pro Snapdragon Sound Chống Ồn Cao Cấp",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBlwzlKlw0eLrAiLbUWEZMIXuWzG0XnJ68Fs6uh3Zy0anjIxodH4yRImzcXmniTl_jmdYFk-7NFVM1nx_OcUNbbnlmBNKPX2E1nnlCYYh900V4ZFPsnxCEWsnzuLFlbeohof_y8IPbZMeejvEJ6k7UXomNoKritQvQCPflrM07wadaF_8pPoBJsQV5bTA_SHNiFp2HmW-gJGeFGqIeHOb4SInCT8nk72pqSuMvw4rMHRqciZP2rANhvCA",
    imageAlt: "SoundPEATS Air4 Pro",
    price: 1190000,
    originalPrice: 1700000,
    discountPercent: 30,
    rating: 4.9,
    totalSold: 2100,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/soundpeats-air4-pro",
  },
  {
    id: "edifier-w820nb-plus",
    name: "Tai nghe chụp tai Edifier W820NB Plus Hi-Res Audio Chống Ồn 43dB",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuD_6qxyhLNw9SU7ICjVjf6VCUsC7ZTfCg91_9H4I_uLFypm-fIyzSsQGNP4WNsm_3J4I2YJsM5feesB0UtR1woWmxMBx7TjR_v6gOnR0i5t3tptTO8LYOXMi3tvgUa9A0cmTGV8dQZO50yXc-Mu5trFZoKW0n1jQWyL6Ey1FC9tLGccEGmcziOjgE8_S9af6CleO183IC48MWSLlcCV4mIJdvj9j0ft10LeZWriYpkXoDiQgKtB4sxw",
    imageAlt: "Edifier W820NB Plus",
    price: 1049000,
    originalPrice: 1399000,
    discountPercent: 25,
    rating: 4.8,
    totalSold: 1500,
    location: "Hà Nội",
    voucherLabel: "Freeship",
    href: "/products/edifier-w820nb-plus",
  },
  {
    id: "qcy-t13-anc",
    name: "Tai nghe không dây QCY T13 ANC 4 Mic Lọc Tiếng Ồn Siêu Rõ",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCQiU2EGsTMfnREOenqmLjwhPw63YXhhtHJS0C12esqotbhzCrQDwcwaVTehLLUOTv2V3SiX193EAzKLp48OTgkUsyR_zKMwcpHVYD8EVJHN2vMvNbBuQ-u5cEBFhL0xdH7u61EiJGd5v_cZc_Dck0XwmbaAVanQpGjO_YBMZZmgVsSpC5RZDDb7ymm20lox8sSBK-RET4oZTthUKRbVXRcPfI-uFKJ2yRXxKnaa5q0yaxD7rBFTPN62A",
    imageAlt: "QCY T13 ANC",
    price: 369000,
    originalPrice: 640000,
    discountPercent: 42,
    rating: 4.7,
    totalSold: 7800,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/qcy-t13-anc",
  },
  {
    id: "samsung-buds2",
    name: "Tai nghe Samsung Galaxy Buds2 Chống Ồn Chủ Động Thông Minh AKG",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8IpG8AsLYe9k7Oj1G5Q5rQfft3TwK7yjOdcOHYrs1SpLwcQ_QqfgEovGJyPT-quvCsn9Ug_hiOvW4w2T8jniirnm7gdhtIdsPMX3Urzg2bz1V-5hguVIvmsEkHWub0xcMwhH2FrYUz_gorDiuXv06p-bsxux0Xb4spn9732JET8Pn2ykAb9jGTTW57iVH6nvJjeEvx44v6m48Qz3w8VbnOZZBsT-MJB6rmdskt2z9DlEfHgyq5pvi9Q",
    imageAlt: "Samsung Galaxy Buds2",
    price: 1490000,
    originalPrice: 2890000,
    discountPercent: 48,
    rating: 4.9,
    totalSold: 3600,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/samsung-galaxy-buds2",
  },
  {
    id: "soundcore-life-p2i",
    name: "Tai nghe Anker Soundcore Life P2i Âm Bass Chắc 2 Chế Độ EQ",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDCCJ2C7cGshZV7Fuo7OInYo4rsMSij8wprHHEN0ZhLkFErs4akdpDmwZT_-ZsKQfidTmsDFGbf1zVz4fbneqpne3mcgbYbExUj9tXQ8_g9egt3sRQhjbBi1iJXfSmAvuFBdbtx1n-kec57SHMfyHr6gSTqQA6QCG8ZKRjbB-h_xNfBk331vHs6bUGiVH1P5NT37RnhXOIEAWNCOJWAxmTEdOCorLy_acpkkgHTeNd7dAPZs51BqwyrbQ",
    imageAlt: "Soundcore Life P2i",
    price: 490000,
    originalPrice: 790000,
    discountPercent: 38,
    rating: 4.7,
    totalSold: 4900,
    location: "Hà Nội",
    voucherLabel: "Freeship",
    href: "/products/soundcore-life-p2i",
  },
  {
    id: "lenovo-lp40-pro",
    name: "Tai nghe Bluetooth Lenovo Thinkplus LP40 Pro Game Lag Cực Thấp",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCqn-m63qG1aOFR5Qh8TGCo_QyPr_hK15EBwOVS-hQpWvDN2u0qIGz0SG1ZvrkZXKFQ4COriet-sE2mHrkiF7mIhRYVaaFRzohrT3WcbCxEJE_5v34eO0AMjlgha0kOCCUbFFqvQ6r69opANzaatksPoWSatta0PpNoYQOyr8qlYMbAhXT30q2SHq2daDaLrpMyjYK98sPpbm9iwNGK2oPo6RG8H1ClEA_UOPAJgg_OXJJzGicPj4fn5Q",
    imageAlt: "Lenovo Thinkplus LP40 Pro",
    price: 219000,
    originalPrice: 490000,
    discountPercent: 55,
    rating: 4.6,
    totalSold: 16500,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/lenovo-lp40-pro",
  },
  {
    id: "earfun-air-pro-3",
    name: "Tai nghe Bluetooth EarFun Air Pro 3 Chống Ồn ANC aptX Adaptive",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAFtotfcArvcvhyfFAVhYmOtNpf3IRVC514pF5byIo5ja7ieK3VFdfocjAGq8W-vYN79NUsBwCT7LDqO-5mY7Tquv6wGG9V2nlqYs7ZO8US1au0Woj5ptaoIk_jWZjerluUBbmU605jPIabVZEpJQqjfiiXiwlIOz_g8b96lwVW5sp01q59VRoRrUioSdL8Y1Vi2UE07AGaZKew9yZV-3RFs8i0zDT0I9eCOQKVC4mOjFf5eY_1aHkpJw",
    imageAlt: "EarFun Air Pro 3",
    price: 1290000,
    originalPrice: 1890000,
    discountPercent: 32,
    rating: 4.8,
    totalSold: 2300,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/earfun-air-pro-3",
  },
  {
    id: "xiaomi-redmi-buds-5-pro",
    name: "Tai nghe True Wireless Xiaomi Redmi Buds 5 Pro Pin 38 Giờ",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGlXRZse05EKNrvLdW4P20rfHPSmdM1qbBBaAfbWYyb3ZECoIq4RXVXpA36rSMjd-iTey4SAUkxFGlv93-APhqyPwexxtW7AkSxiXG-Dc4TfkcfmCdpLWmO0Es_UxH3IIllAg6gBH64IurOU0FRs5SfG-31LhvOUyL_kadKeXccLRVYSFOJH18zevufog7Rx-O2S0bPhLyOLGmEGTYE1tRJ9AEGqhV21pPhgVs5C1iyK9PZyOuORCFuw",
    imageAlt: "Xiaomi Redmi Buds 5 Pro",
    price: 1090000,
    originalPrice: 1990000,
    discountPercent: 46,
    rating: 4.9,
    totalSold: 6800,
    location: "Hà Nội",
    voucherLabel: "Giảm 10K",
    href: "/products/xiaomi-redmi-buds-5-pro",
  },
  {
    id: "defunc-true-basic",
    name: "Tai nghe không dây Defunc True Basic Âm Thanh Sống Động",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBS7uJivvwgryvfl2fNrw9XP3t22OAkba1lRcUza2LG_qK7WawjEDPImF8QihPM5q-hv3m3RkxSjDzVnt_lHtNe08HMKP-Ff674t5TIg99d6VS56b0O2nQYxU0ePxXxnh3vLUBIF9Yo4ffIPk4zcJD0tJEyWZS_7NXrCdw-4Rye-KqQOizymrO185fGTZzwXbM-aRK2AafNaQYWIoazeXEaot76uOeSA3IlrvddhiHIvh-R3lRilrCNtg",
    imageAlt: "Defunc True Basic",
    price: 399000,
    originalPrice: 500000,
    discountPercent: 20,
    rating: 4.7,
    totalSold: 1100,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/defunc-true-basic",
  },
  {
    id: "shokz-openmove",
    name: "Tai nghe Bluetooth thể thao Shokz OpenMove Truyền Âm Qua Xương",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuD_6qxyhLNw9SU7ICjVjf6VCUsC7ZTfCg91_9H4I_uLFypm-fIyzSsQGNP4WNsm_3J4I2YJsM5feesB0UtR1woWmxMBx7TjR_v6gOnR0i5t3tptTO8LYOXMi3tvgUa9A0cmTGV8dQZO50yXc-Mu5trFZoKW0n1jQWyL6Ey1FC9tLGccEGmcziOjgE8_S9af6CleO183IC48MWSLlcCV4mIJdvj9j0ft10LeZWriYpkXoDiQgKtB4sxw",
    imageAlt: "Shokz OpenMove",
    price: 1590000,
    originalPrice: 2490000,
    discountPercent: 36,
    rating: 4.9,
    totalSold: 980,
    location: "Hà Nội",
    voucherLabel: "Freeship",
    href: "/products/shokz-openmove",
  },
  {
    id: "sony-wh-ch520",
    name: "Tai nghe chụp tai Sony WH-CH520 Pin 50 Giờ Kết Nối Đa Thiết Bị",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCoePQC_nLCeERga7RWn-38gTyLgRAZSxMJFftr2SfvFz_S3LtLMZJivqqRhQlXl3nKxoZloc-_WWxDHeQ0Mty7OMxIHHejckCzK3r0t4KT3fELTOiNNTt3qSOK_YHQg2Uo08Ky1SPzVbtp2eWGTq-UliEN7Dz57optKMkhSBCbjWG5dvJ09BJFfLCMzshDFxpRSjZ65a4ZMqbSHakha_n0IY6wyp7aMn37jJ-M5pvo6Gv2vcc_ERcsKw",
    imageAlt: "Sony WH-CH520",
    price: 890000,
    originalPrice: 1590000,
    discountPercent: 44,
    rating: 4.9,
    totalSold: 5400,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Giảm 20K",
    href: "/products/sony-wh-ch520",
  },
  {
    id: "beats-studio-buds",
    name: "Tai nghe Bluetooth Beats Studio Buds Chống Ồn Chủ Động",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBlwzlKlw0eLrAiLbUWEZMIXuWzG0XnJ68Fs6uh3Zy0anjIxodH4yRImzcXmniTl_jmdYFk-7NFVM1nx_OcUNbbnlmBNKPX2E1nnlCYYh900V4ZFPsnxCEWsnzuLFlbeohof_y8IPbZMeejvEJ6k7UXomNoKritQvQCPflrM07wadaF_8pPoBJsQV5bTA_SHNiFp2HmW-gJGeFGqIeHOb4SInCT8nk72pqSuMvw4rMHRqciZP2rANhvCA",
    imageAlt: "Beats Studio Buds",
    price: 2190000,
    originalPrice: 3090000,
    discountPercent: 29,
    rating: 4.8,
    totalSold: 1400,
    location: "Đà Nẵng",
    voucherLabel: "Freeship",
    href: "/products/beats-studio-buds",
  },
  {
    id: "soundpeats-clear",
    name: "Tai nghe True Wireless Soundpeats Clear Trong Suốt Gaming",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCqn-m63qG1aOFR5Qh8TGCo_QyPr_hK15EBwOVS-hQpWvDN2u0qIGz0SG1ZvrkZXKFQ4COriet-sE2mHrkiF7mIhRYVaaFRzohrT3WcbCxEJE_5v34eO0AMjlgha0kOCCUbFFqvQ6r69opANzaatksPoWSatta0PpNoYQOyr8qlYMbAhXT30q2SHq2daDaLrpMyjYK98sPpbm9iwNGK2oPo6RG8H1ClEA_UOPAJgg_OXJJzGicPj4fn5Q",
    imageAlt: "Soundpeats Clear",
    price: 349000,
    originalPrice: 699000,
    discountPercent: 50,
    rating: 4.7,
    totalSold: 8200,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/soundpeats-clear",
  },
  {
    id: "marshall-major-iv",
    name: "Tai nghe Bluetooth Marshall Major IV Sạc Không Dây Pin 80H",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJayQPfFDOfijOP6zo0limreMsKdOvOz2SXwKEWHooeDwF-lERerB0S5Q2N8zEJvGNZS0aIKWGblk7LXKTc9oCEl1acI3I9UzdgTSjs1cQgg_YMnYFntllSA2X3J5SCCw4W65mzGNpOIycJmNyANwp_vBUZTHvLGDq0COc6btQnWURu2cT0csjvbCDnka6ZficU43eMLlOX4AaQXCnLybjsmCZzfDjwPJqZ_wm1lf9LnOzekkXp8KQJw",
    imageAlt: "Marshall Major IV",
    price: 2890000,
    originalPrice: 4450000,
    discountPercent: 35,
    rating: 4.9,
    totalSold: 1900,
    location: "TP. Hồ Chí Minh",
    voucherLabel: "Freeship",
    href: "/products/marshall-major-iv",
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
