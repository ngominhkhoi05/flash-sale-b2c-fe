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
    case "BANNED":
      return "Đã khóa / Cấm";
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
        const data = await getMyStoreProfile();
        if (data && typeof window !== "undefined") {
          const rawLogo =
            localStorage.getItem(`seller_logo_${data.id}`) ||
            localStorage.getItem("seller_logo_default");
          const savedLogo = rawLogo && rawLogo.length < 500 * 1024 ? rawLogo : "";
          if (savedLogo) {
            data.logoUrl = savedLogo;
          }
        }
        return data;
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

  const rawLocalLogo =
    typeof window !== "undefined"
      ? (store?.id ? localStorage.getItem(`seller_logo_${store.id}`) : null) ||
        localStorage.getItem("seller_logo_default")
      : null;
  const localLogo = rawLocalLogo && rawLocalLogo.length < 500 * 1024 ? rawLocalLogo : null;
  const storeLogoUrl = localLogo || store?.logoUrl || "";

  const statusUpper = (store?.status || "").toUpperCase();
  const isBanned = statusUpper === "BANNED" || statusUpper === "SUSPENDED" || statusUpper === "LOCKED";
  const isApproved = statusUpper === "APPROVED" || statusUpper === "ACTIVE";
  const isPending = statusUpper === "PENDING" || statusUpper === "PENDING_APPROVAL";

  return {
    ...query,
    store,
    storeName,
    storeCode,
    storeStatusText,
    initials,
    storeLogoUrl,
    isBanned,
    isApproved,
    isPending,
  };
}
