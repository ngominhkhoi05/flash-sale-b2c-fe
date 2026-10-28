"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  getAdminFlashSaleSlots,
  getAdminSkuApprovals,
  getAdminApprovalCounts,
  getAdminRealtimeTelemetry,
  getAdminLiveSkus,
  getAdminCategories,
  getAdminUsers,
  getAdminStores,
  getAdminProducts,
  getAdminPlatformVouchers,
} from "@/lib/api/admin";
import type { AdminFlashSaleSession } from "@/types/flash-sale";
import type { SkuApprovalItem } from "@/types/sku-approval";
import type { RealtimeTelemetry, LiveSkuInventoryItem } from "@/types/flash-monitor";

/**
 * ADMIN QUERY KEYS – Single source of truth cho React Query cache trong Admin Console
 */
export const ADMIN_QUERY_KEYS = {
  slots: ["admin", "flash-sale", "slots"] as const,
  approvals: (slotId?: number) => ["admin", "flash-sale", "approvals", slotId ?? "all"] as const,
  counts: (slotId?: number) => ["admin", "flash-sale", "counts", slotId ?? "all"] as const,
  telemetry: (slotId?: number) => ["admin", "flash-sale", "telemetry", slotId ?? "active"] as const,
  liveSkus: (slotId?: number) => ["admin", "flash-sale", "live-skus", slotId ?? "active"] as const,
  categories: ["admin", "categories"] as const,
  users: (page = 0, search = "", role = "ALL", status = "ALL") =>
    ["admin", "users", page, search, role, status] as const,
  stores: (status = "ALL", search = "", page = 0) =>
    ["admin", "stores", status, search, page] as const,
  products: (status = "ALL", search = "", page = 0) =>
    ["admin", "products", status, search, page] as const,
  vouchers: ["admin", "vouchers"] as const,
};
// ============================================================================
// CHÍNH SÁCH CACHING PHÂN TẦNG THEO TẦN SUẤT BIẾN ĐỘNG DỮ LIỆU (Nguyên tắc 2)
// ============================================================================
export const ADMIN_CACHE_POLICY = {
  // 1. TĨNH / CỰC KỲ ÍT THAY ĐỔI: Danh mục ngành hàng (Categories)
  STATIC: {
    staleTime: 10 * 60 * 1000, // 10 phút
    gcTime: 30 * 60 * 1000,    // 30 phút trong bộ nhớ RAM
  },
  // 2. ÍT THAY ĐỔI: Gian hàng (Stores), Mã voucher sàn
  LOW_MUTATION: {
    staleTime: 5 * 60 * 1000,  // 5 phút
    gcTime: 15 * 60 * 1000,    // 15 phút
  },
  // 3. NGHIỆP VỤ TRUNG BÌNH: Người dùng (Users), Sản phẩm (Products), Khung giờ (Slots)
  MEDIUM_MUTATION: {
    staleTime: 2 * 60 * 1000,  // 2 phút
    gcTime: 10 * 60 * 1000,    // 10 phút
  },
  // 4. BIẾN ĐỘNG CAO / DUYỆT TỨC THÌ: SKU chờ duyệt (Approvals), Thống kê badge (Counts)
  HIGH_MUTATION: {
    staleTime: 30 * 1000,      // 30 giây
    gcTime: 5 * 60 * 1000,     // 5 phút
  },
  // 5. GIÁM SÁT REALTIME: Telemetry, Tồn kho tức thì (Live SKUs)
  REALTIME: {
    staleTime: 3 * 1000,       // 3 giây
    gcTime: 60 * 1000,         // 1 phút
  },
};

/**
 * Hook nạp danh sách khung giờ Flash Sale có Caching (Medium: 2 phút)
 */
export function useAdminSlotsQuery() {
  return useQuery<AdminFlashSaleSession[]>({
    queryKey: ADMIN_QUERY_KEYS.slots,
    queryFn: () => getAdminFlashSaleSlots(),
    staleTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.staleTime,
    gcTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.gcTime,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook nạp danh sách SKU chờ duyệt có Caching (High: 30s)
 */
export function useAdminApprovalsQuery(slotId?: number) {
  return useQuery<SkuApprovalItem[]>({
    queryKey: ADMIN_QUERY_KEYS.approvals(slotId),
    queryFn: () => getAdminSkuApprovals(slotId),
    staleTime: ADMIN_CACHE_POLICY.HIGH_MUTATION.staleTime,
    gcTime: ADMIN_CACHE_POLICY.HIGH_MUTATION.gcTime,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook nạp số lượng thống kê duyệt SKU (High: 30s)
 */
export function useAdminApprovalCountsQuery(slotId?: number) {
  return useQuery<{ pending: number; approved: number; rejected: number }>({
    queryKey: ADMIN_QUERY_KEYS.counts(slotId),
    queryFn: () => getAdminApprovalCounts(slotId),
    staleTime: ADMIN_CACHE_POLICY.HIGH_MUTATION.staleTime,
    gcTime: ADMIN_CACHE_POLICY.HIGH_MUTATION.gcTime,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook nạp dữ liệu Telemetry giám sát phiên (Realtime: 3s)
 */
export function useAdminTelemetryQuery(slotId?: number) {
  return useQuery<RealtimeTelemetry>({
    queryKey: ADMIN_QUERY_KEYS.telemetry(slotId),
    queryFn: () => (slotId ? getAdminRealtimeTelemetry(slotId) : Promise.reject(new Error("No slotId"))),
    enabled: typeof slotId === "number" && slotId > 0,
    staleTime: ADMIN_CACHE_POLICY.REALTIME.staleTime,
    gcTime: ADMIN_CACHE_POLICY.REALTIME.gcTime,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook nạp Live SKUs giám sát tồn kho (Realtime: 3s)
 */
export function useAdminLiveSkusQuery(slotId?: number) {
  return useQuery<LiveSkuInventoryItem[]>({
    queryKey: ADMIN_QUERY_KEYS.liveSkus(slotId),
    queryFn: () => (slotId ? getAdminLiveSkus(slotId) : Promise.resolve([])),
    enabled: typeof slotId === "number" && slotId > 0,
    staleTime: ADMIN_CACHE_POLICY.REALTIME.staleTime,
    gcTime: ADMIN_CACHE_POLICY.REALTIME.gcTime,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook nạp danh sách ngành hàng & hoa hồng có Caching (Static: 10 phút)
 */
export function useAdminCategoriesQuery() {
  return useQuery<import("@/lib/api/admin").AdminCategoryItem[]>({
    queryKey: ADMIN_QUERY_KEYS.categories,
    queryFn: () => getAdminCategories(),
    staleTime: ADMIN_CACHE_POLICY.STATIC.staleTime,
    gcTime: ADMIN_CACHE_POLICY.STATIC.gcTime,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook nạp danh sách người dùng toàn sàn có Caching (Medium: 2 phút)
 */
export function useAdminUsersQuery(params?: {
  page?: number;
  size?: number;
  role?: string;
  status?: string;
  search?: string;
}) {
  const page = params?.page ?? 0;
  const search = params?.search ?? "";
  const role = params?.role ?? "ALL";
  const status = params?.status ?? "ALL";

  return useQuery<import("@/types/api").PageResponse<import("@/types/admin").AdminUser>>({
    queryKey: ADMIN_QUERY_KEYS.users(page, search, role, status),
    queryFn: () => getAdminUsers(params),
    staleTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.staleTime,
    gcTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.gcTime,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook nạp danh sách gian hàng có Caching (Low mutation: 5 phút)
 */
export function useAdminStoresQuery(status?: string) {
  const tabStatus = status ?? "ALL";
  return useQuery<import("@/lib/api/admin").AdminStore[]>({
    queryKey: ADMIN_QUERY_KEYS.stores(tabStatus, "", 0),
    queryFn: () => getAdminStores(status === "ALL" ? undefined : status),
    staleTime: ADMIN_CACHE_POLICY.LOW_MUTATION.staleTime,
    gcTime: ADMIN_CACHE_POLICY.LOW_MUTATION.gcTime,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook nạp danh sách sản phẩm toàn sàn có Caching (Medium: 2 phút)
 */
export function useAdminProductsQuery(params?: {
  page?: number;
  size?: number;
  status?: string;
  search?: string;
  categoryId?: number;
  storeId?: number;
}) {
  const status = params?.status ?? "ALL";
  const search = params?.search ?? "";
  const page = params?.page ?? 0;

  return useQuery<import("@/lib/api/admin").AdminProduct[]>({
    queryKey: ADMIN_QUERY_KEYS.products(status, search, page),
    queryFn: () => getAdminProducts(params),
    staleTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.staleTime,
    gcTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.gcTime,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });
}

/**
 * PREFETCHING ROUTE HELPER (Just-in-Time Prefetch khi Hover / Focus)
 * Chỉ nạp trước dữ liệu của đúng trang người dùng đang di chuột tới,
 * tránh lãng phí tài nguyên và không nạp dư thừa.
 */
export function prefetchAdminRoute(queryClient: QueryClient, href?: string) {
  if (!href) return;

  if (href === "/admin/flash-sale") {
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.slots,
      queryFn: () => getAdminFlashSaleSlots(),
      staleTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.staleTime,
    });
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.counts(undefined),
      queryFn: () => getAdminApprovalCounts(),
      staleTime: ADMIN_CACHE_POLICY.HIGH_MUTATION.staleTime,
    });
  } else if (href === "/admin/flash-sale/approvals") {
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.slots,
      queryFn: () => getAdminFlashSaleSlots(),
      staleTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.staleTime,
    });
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.approvals(undefined),
      queryFn: () => getAdminSkuApprovals(),
      staleTime: ADMIN_CACHE_POLICY.HIGH_MUTATION.staleTime,
    });
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.counts(undefined),
      queryFn: () => getAdminApprovalCounts(),
      staleTime: ADMIN_CACHE_POLICY.HIGH_MUTATION.staleTime,
    });
  } else if (href === "/admin/flash-sale/monitor") {
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.slots,
      queryFn: () => getAdminFlashSaleSlots(),
      staleTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.staleTime,
    });
  } else if (href === "/admin/categories") {
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.categories,
      queryFn: () => getAdminCategories(),
      staleTime: ADMIN_CACHE_POLICY.STATIC.staleTime,
    });
  } else if (href === "/admin/stores") {
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.stores("ALL", "", 0),
      queryFn: () => getAdminStores(undefined),
      staleTime: ADMIN_CACHE_POLICY.LOW_MUTATION.staleTime,
    });
  } else if (href === "/admin/users") {
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.users(0, "", "ALL", "ALL"),
      queryFn: () => getAdminUsers({ page: 0, size: 100 }),
      staleTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.staleTime,
    });
  } else if (href === "/admin/products") {
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.products("ALL", "", 0),
      queryFn: () => getAdminProducts({ page: 0, size: 200 }),
      staleTime: ADMIN_CACHE_POLICY.MEDIUM_MUTATION.staleTime,
    });
    void queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.vouchers,
      queryFn: () => getAdminPlatformVouchers(),
      staleTime: ADMIN_CACHE_POLICY.LOW_MUTATION.staleTime,
    });
  }
}

