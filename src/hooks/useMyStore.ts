"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyStoreProfile } from "@/lib/api/seller";
import type { SellerStoreProfileResponse } from "@/types/seller";
import { useAuth } from "@/hooks/useAuth";

export const storeKeys = {
  all: ["seller", "store"] as const,
  me: () => [...storeKeys.all, "me"] as const,
};

/**
 * Chuyển đổi mã trạng thái gian hàng sang tiếng Việt hiển thị
 */
export function formatStoreStatus(status?: string): string {
  if (!status) return "Chờ duyệt";
  const upper = status.toUpperCase();
  switch (upper) {
    case "APPROVED":
    case "ACTIVE":
      return "Đã duyệt";
    case "PENDING":
    case "PENDING_APPROVAL":
      return "Chờ duyệt";
    case "REJECTED":
      return "Bị từ chối";
    case "SUSPENDED":
    case "LOCKED":
      return "Tạm dừng";
    default:
      return status;
  }
}

/**
 * Sinh chữ cái viết tắt đại diện (Initials) từ tên gian hàng
 */
export function getStoreInitials(name?: string): string {
  if (!name || !name.trim()) return "VM";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

/**
 * Hook useMyStore: Lấy thông tin gian hàng thật của tài khoản đang đăng nhập
 * Sử dụng TanStack Query để cache và đồng bộ dữ liệu giữa Sidebar, Topbar và Dashboard.
 */
export function useMyStore() {
  const { isAuthenticated, isHydrated } = useAuth();

  const query = useQuery<SellerStoreProfileResponse | null>({
    queryKey: storeKeys.me(),
    queryFn: async () => {
      try {
        return await getMyStoreProfile();
      } catch (err) {
        console.warn("[useMyStore] Chưa có gian hàng hoặc lỗi nạp:", err);
        return null;
      }
    },
    enabled: isHydrated && isAuthenticated,
    staleTime: 60_000,
  });

  const store = query.data;
  const storeName = store?.storeName || "";
  const storeCode = store?.id ? `#VM-${String(store.id).padStart(4, "0")}` : "";
  const storeStatusText = formatStoreStatus(store?.status);
  const initials = getStoreInitials(storeName);

  return {
    ...query,
    store,
    storeName,
    storeCode,
    storeStatusText,
    initials,
  };
}
