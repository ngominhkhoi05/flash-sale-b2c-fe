import type {
  SellerOrderResponse,
  SellerProductSummaryResponse,
  FlashSaleSlotItem,
  RegisteredFlashSaleHistoryItem,
  SellerStoreProfileResponse,
  SellerWarehouseAddressItem,
  SellerReviewItem,
  SellerReviewSummaryResponse,
  SellerVoucherItem,
  SellerWalletResponse,
  SellerBankAccount,
  SellerBankAccountResponse,
} from "@/types/seller";
import type { PageResponse } from "@/types/api";
import {
  getSellerOrders,
  getSellerProducts,
  getFlashSaleSlots,
  getRegisteredFlashSaleHistory,
  getMyStoreProfile,
  getStoreAddresses,
  getSellerReviews,
  getSellerReviewSummary,
  getSellerVouchers,
  getSellerWallet,
  getSellerBankAccount,
} from "@/lib/api/seller";

/**
 * Global In-Memory Persistent Cache for Seller Portal.
 * Caches data across route changes to provide 0ms instant page loads
 * with Stale-While-Revalidate background synchronization.
 */
interface SellerCacheState {
  orders: SellerOrderResponse[] | null;
  ordersTimestamp: number;
  products: Record<string, { data: PageResponse<SellerProductSummaryResponse>; timestamp: number }>;
  flashSaleSlots: FlashSaleSlotItem[] | null;
  flashSaleSlotsTimestamp: number;
  flashSaleHistory: RegisteredFlashSaleHistoryItem[] | null;
  flashSaleHistoryTimestamp: number;
  // Profile
  profile: SellerStoreProfileResponse | null;
  addresses: SellerWarehouseAddressItem[] | null;
  profileTimestamp: number;
  // Reviews
  reviews: SellerReviewItem[] | null;
  reviewsSummary: SellerReviewSummaryResponse | null;
  reviewsTimestamp: number;
  // Vouchers
  vouchers: SellerVoucherItem[] | null;
  vouchersTimestamp: number;
  // Wallet
  wallet: SellerWalletResponse | null;
  bankAccount: SellerBankAccount | SellerBankAccountResponse | null;
  walletTimestamp: number;
}

const cacheState: SellerCacheState = {
  orders: null,
  ordersTimestamp: 0,
  products: {},
  flashSaleSlots: null,
  flashSaleSlotsTimestamp: 0,
  flashSaleHistory: null,
  flashSaleHistoryTimestamp: 0,
  profile: null,
  addresses: null,
  profileTimestamp: 0,
  reviews: null,
  reviewsSummary: null,
  reviewsTimestamp: 0,
  vouchers: null,
  vouchersTimestamp: 0,
  wallet: null,
  bankAccount: null,
  walletTimestamp: 0,
};

// In-flight promises to deduplicate duplicate network requests
const inFlightRequests = new Map<string, Promise<any>>();

// --- Orders ---
export function getCachedOrders(): SellerOrderResponse[] | null {
  return cacheState.orders;
}

export function setCachedOrders(orders: SellerOrderResponse[]): void {
  cacheState.orders = orders;
  cacheState.ordersTimestamp = Date.now();
}

export function prependCachedOrder(newOrder: SellerOrderResponse): void {
  if (!cacheState.orders) {
    cacheState.orders = [newOrder];
  } else {
    const filtered = cacheState.orders.filter(
      (o) => o.id !== newOrder.id && (newOrder.orderCode ? o.orderCode !== newOrder.orderCode : true)
    );
    cacheState.orders = [newOrder, ...filtered];
  }
  cacheState.ordersTimestamp = Date.now();
}

// --- Products ---
export function getCachedProducts(key: string): PageResponse<SellerProductSummaryResponse> | null {
  return cacheState.products[key]?.data || null;
}

export function setCachedProducts(key: string, data: PageResponse<SellerProductSummaryResponse>): void {
  cacheState.products[key] = {
    data,
    timestamp: Date.now(),
  };
}

export function invalidateProductsCache(): void {
  cacheState.products = {};
}

// --- Flash Sale ---
export function getCachedFlashSaleSlots(): FlashSaleSlotItem[] | null {
  return cacheState.flashSaleSlots;
}

export function setCachedFlashSaleSlots(slots: FlashSaleSlotItem[]): void {
  cacheState.flashSaleSlots = slots;
  cacheState.flashSaleSlotsTimestamp = Date.now();
}

export function getCachedFlashSaleHistory(): RegisteredFlashSaleHistoryItem[] | null {
  return cacheState.flashSaleHistory;
}

export function setCachedFlashSaleHistory(history: RegisteredFlashSaleHistoryItem[]): void {
  cacheState.flashSaleHistory = history;
  cacheState.flashSaleHistoryTimestamp = Date.now();
}

// --- Profile & Addresses ---
export function getCachedProfile(): {
  profile: SellerStoreProfileResponse | null;
  addresses: SellerWarehouseAddressItem[] | null;
} | null {
  if (!cacheState.profile) return null;
  return {
    profile: cacheState.profile,
    addresses: cacheState.addresses || [],
  };
}

export function setCachedProfile(
  profile: SellerStoreProfileResponse,
  addresses?: SellerWarehouseAddressItem[]
): void {
  cacheState.profile = profile;
  if (addresses) cacheState.addresses = addresses;
  cacheState.profileTimestamp = Date.now();
}

export function setCachedAddresses(addresses: SellerWarehouseAddressItem[]): void {
  cacheState.addresses = addresses;
}

// --- Reviews ---
export function getCachedReviews(): {
  reviews: SellerReviewItem[] | null;
  summary: SellerReviewSummaryResponse | null;
} | null {
  if (!cacheState.reviews) return null;
  return {
    reviews: cacheState.reviews,
    summary: cacheState.reviewsSummary,
  };
}

export function setCachedReviews(
  reviews: SellerReviewItem[],
  summary?: SellerReviewSummaryResponse
): void {
  cacheState.reviews = reviews;
  if (summary) cacheState.reviewsSummary = summary;
  cacheState.reviewsTimestamp = Date.now();
}

// --- Vouchers ---
export function getCachedVouchers(): SellerVoucherItem[] | null {
  return cacheState.vouchers;
}

export function setCachedVouchers(vouchers: SellerVoucherItem[]): void {
  cacheState.vouchers = vouchers;
  cacheState.vouchersTimestamp = Date.now();
}

// --- Wallet ---
export function getCachedWallet(): {
  wallet: SellerWalletResponse | null;
  bankAccount: SellerBankAccount | SellerBankAccountResponse | null;
} | null {
  if (!cacheState.wallet) return null;
  return {
    wallet: cacheState.wallet,
    bankAccount: cacheState.bankAccount,
  };
}

export function setCachedWallet(
  wallet: SellerWalletResponse,
  bankAccount?: SellerBankAccount | SellerBankAccountResponse | null
): void {
  cacheState.wallet = wallet;
  if (bankAccount !== undefined) cacheState.bankAccount = bankAccount;
  cacheState.walletTimestamp = Date.now();
}

// =================== PREFETCHERS ===================

export async function prefetchSellerOrders(): Promise<SellerOrderResponse[] | null> {
  const key = "orders";
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);

  const promise = getSellerOrders(0, 100)
    .then((res) => {
      const list = res.items || res.content || [];
      setCachedOrders(list);
      return list;
    })
    .catch(() => null)
    .finally(() => inFlightRequests.delete(key));

  inFlightRequests.set(key, promise);
  return promise;
}

export async function prefetchSellerProducts(
  page = 0,
  pageSize = 10,
  tab = "ALL"
): Promise<PageResponse<SellerProductSummaryResponse> | null> {
  const cacheKey = `${tab}_${page}_${pageSize}`;
  if (inFlightRequests.has(cacheKey)) return inFlightRequests.get(cacheKey);

  const promise = getSellerProducts(page, pageSize, tab === "ALL" ? undefined : tab)
    .then((res) => {
      setCachedProducts(cacheKey, res);
      return res;
    })
    .catch(() => null)
    .finally(() => inFlightRequests.delete(cacheKey));

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

export async function prefetchFlashSaleData(): Promise<void> {
  const key = "flashsale";
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);

  const promise = Promise.allSettled([
    getFlashSaleSlots(),
    getRegisteredFlashSaleHistory(),
  ])
    .then(([slotsRes, histRes]) => {
      if (slotsRes.status === "fulfilled" && slotsRes.value) {
        setCachedFlashSaleSlots(slotsRes.value);
      }
      if (histRes.status === "fulfilled" && histRes.value) {
        setCachedFlashSaleHistory(histRes.value);
      }
    })
    .catch(() => {})
    .finally(() => inFlightRequests.delete(key));

  inFlightRequests.set(key, promise);
  return promise;
}

export async function prefetchSellerProfile(): Promise<void> {
  const key = "profile";
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);

  const promise = Promise.allSettled([getMyStoreProfile(), getStoreAddresses()])
    .then(([profRes, addrRes]) => {
      if (profRes.status === "fulfilled" && profRes.value) {
        const addresses = addrRes.status === "fulfilled" && addrRes.value ? addrRes.value : [];
        setCachedProfile(profRes.value, addresses);
      }
    })
    .catch(() => {})
    .finally(() => inFlightRequests.delete(key));

  inFlightRequests.set(key, promise);
  return promise;
}

export async function prefetchSellerReviews(): Promise<void> {
  const key = "reviews";
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);

  const promise = Promise.allSettled([getSellerReviewSummary(), getSellerReviews(0, 100)])
    .then(([sumRes, revRes]) => {
      const summary = sumRes.status === "fulfilled" ? sumRes.value : undefined;
      const reviews = revRes.status === "fulfilled" && revRes.value?.content ? revRes.value.content : [];
      setCachedReviews(reviews, summary);
    })
    .catch(() => {})
    .finally(() => inFlightRequests.delete(key));

  inFlightRequests.set(key, promise);
  return promise;
}

export async function prefetchSellerVouchers(): Promise<void> {
  const key = "vouchers";
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);

  const promise = getSellerVouchers(0, 100)
    .then((res) => {
      const list = res.items || res.content || [];
      setCachedVouchers(list);
    })
    .catch(() => {})
    .finally(() => inFlightRequests.delete(key));

  inFlightRequests.set(key, promise);
  return promise;
}

export async function prefetchSellerWallet(): Promise<void> {
  const key = "wallet";
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);

  const promise = Promise.allSettled([getSellerWallet(), getSellerBankAccount()])
    .then(([wRes, bRes]) => {
      if (wRes.status === "fulfilled" && wRes.value) {
        const bank = bRes.status === "fulfilled" ? bRes.value : null;
        setCachedWallet(wRes.value, bank);
      }
    })
    .catch(() => {})
    .finally(() => inFlightRequests.delete(key));

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Warm up all essential seller data in idle background
 */
export function prefetchAllSellerData(): void {
  if (typeof window === "undefined") return;
  const runner = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 200));
  runner(() => {
    void prefetchSellerOrders();
    void prefetchSellerProducts(0, 10, "ALL");
    void prefetchFlashSaleData();
    void prefetchSellerProfile();
    void prefetchSellerReviews();
    void prefetchSellerVouchers();
    void prefetchSellerWallet();
  });
}
