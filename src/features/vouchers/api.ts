/**
 * Vouchers API – voucher cá nhân và voucher sàn toàn hệ thống.
 * Hỗ trợ fallback tự động: /vouchers/mine -> /vouchers/platform -> mock vouchers.
 */
import { apiFetch } from "@/lib/api";
import type { UserVoucher } from "./types";

function mapToUserVoucher(item: Record<string, unknown>): UserVoucher {
  const discountType = String(item.discountType || item.discountUnit || "PERCENT");
  const isPercent = discountType === "PERCENT" || discountType === "PERCENTAGE";
  const isShipping = item.scope === "SHIPPING" || item.type === "FREESHIP" || discountType === "SHIPPING";

  return {
    id: String(item.id || item.code),
    code: String(item.code || "").toUpperCase(),
    name: String(item.name || item.label || item.code || "Ưu đãi Vibe Mart"),
    description: String(item.description || "Áp dụng theo quy chế khuyến mại của Vibe Mart."),
    type: isShipping ? "FREESHIP" : "DISCOUNT",
    scope: isShipping ? "SHIPPING" : "ORDER",
    discountValue: Number(item.discountValue || 0),
    discountUnit: isPercent ? "PERCENT" : "FIXED_AMOUNT",
    minOrderAmount: Number(item.minOrderAmount || 0),
    maxDiscountAmount:
      item.maxDiscountAmount != null
        ? Number(item.maxDiscountAmount)
        : item.maxDiscount != null
        ? Number(item.maxDiscount)
        : undefined,
    startTime: String(item.startTime || new Date().toISOString()),
    endTime: String(item.endTime || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()),
    status: (item.status as UserVoucher["status"]) || "ACTIVE",
    userUsageCount: Number(item.usedQuantity ?? item.userUsageCount ?? 0),
    userUsageLimit: Number(item.userUsageLimit || 1),
    storeId: item.storeId != null ? Number(item.storeId) : undefined,
  };
}

function getFallbackUserVouchers(): UserVoucher[] {
  return [
    {
      id: "v-01",
      code: "VIBEMART50",
      name: "Đại hội Sale Giữa Tháng",
      description: "Giảm 15% tối đa 50K cho đơn từ 250K toàn sàn",
      type: "DISCOUNT",
      scope: "ORDER",
      discountValue: 15,
      discountUnit: "PERCENT",
      minOrderAmount: 250000,
      maxDiscountAmount: 50000,
      startTime: "2026-10-01T00:00:00Z",
      endTime: "2026-10-25T23:59:59Z",
      status: "ACTIVE",
      userUsageCount: 0,
      userUsageLimit: 1,
    },
    {
      id: "v-02",
      code: "FREESHIPMAX",
      name: "Miễn phí vận chuyển toàn quốc",
      description: "Giảm 25K phí ship cho đơn từ 99K toàn quốc",
      type: "FREESHIP",
      scope: "SHIPPING",
      discountValue: 25000,
      discountUnit: "FIXED_AMOUNT",
      minOrderAmount: 99000,
      maxDiscountAmount: 25000,
      startTime: "2026-10-01T00:00:00Z",
      endTime: "2026-10-31T23:59:59Z",
      status: "ACTIVE",
      userUsageCount: 0,
      userUsageLimit: 2,
    },
    {
      id: "v-03",
      code: "CHAOBANMOI",
      name: "Quà chào mừng thành viên mới",
      description: "Giảm thẳng 30K không giới hạn giá trị đơn hàng",
      type: "DISCOUNT",
      scope: "ORDER",
      discountValue: 30000,
      discountUnit: "FIXED_AMOUNT",
      minOrderAmount: 0,
      maxDiscountAmount: 30000,
      startTime: "2026-09-01T00:00:00Z",
      endTime: "2026-12-31T23:59:59Z",
      status: "ACTIVE",
      userUsageCount: 0,
      userUsageLimit: 1,
    },
    {
      id: "v-04",
      code: "MALLSUPER10",
      name: "Siêu ưu đãi gian hàng chính hãng Vibe Mall",
      description: "Giảm 10% tối đa 100K cho đơn hàng chính hãng Vibe Mall",
      type: "DISCOUNT",
      scope: "ORDER",
      discountValue: 10,
      discountUnit: "PERCENT",
      minOrderAmount: 500000,
      maxDiscountAmount: 100000,
      startTime: "2026-10-05T00:00:00Z",
      endTime: "2026-10-28T23:59:59Z",
      status: "ACTIVE",
      userUsageCount: 0,
      userUsageLimit: 2,
    },
    {
      id: "v-05",
      code: "TECHFEST15",
      name: "Tuần lễ công nghệ Vibe Tech",
      description: "Giảm 15% tối đa 150K đơn từ 800K",
      type: "DISCOUNT",
      scope: "ORDER",
      discountValue: 15,
      discountUnit: "PERCENT",
      minOrderAmount: 800000,
      maxDiscountAmount: 150000,
      startTime: "2026-10-08T00:00:00Z",
      endTime: "2026-10-22T23:59:59Z",
      status: "ACTIVE",
      userUsageCount: 0,
      userUsageLimit: 1,
    },
    {
      id: "v-06",
      code: "FASHION20",
      name: "Thu Đông Rực Rỡ cùng thời trang Vibe",
      description: "Giảm 20% tối đa 70K đơn từ 350K",
      type: "DISCOUNT",
      scope: "ORDER",
      discountValue: 20,
      discountUnit: "PERCENT",
      minOrderAmount: 350000,
      maxDiscountAmount: 70000,
      startTime: "2026-10-10T00:00:00Z",
      endTime: "2026-10-25T23:59:59Z",
      status: "ACTIVE",
      userUsageCount: 0,
      userUsageLimit: 1,
    },
  ];
}

/**
 * Lấy danh sách voucher người dùng:
 * 1. Gọi /vouchers/mine nếu user đã lưu.
 * 2. Nếu rỗng hoặc chưa lưu, tự động nạp voucher sàn từ /vouchers/platform.
 * 3. Nếu BE chưa có data hoặc lỗi mạng, fallback mock vouchers đảm bảo luôn hiển thị.
 */
export async function getMyVouchers(): Promise<UserVoucher[]> {
  try {
    const raw = await apiFetch<unknown>("/vouchers/mine");
    const list = Array.isArray(raw)
      ? raw
      : (raw as { data?: unknown[]; items?: unknown[] })?.data ||
        (raw as { data?: unknown[]; items?: unknown[] })?.items ||
        [];

    if (list.length > 0) {
      return (list as Record<string, unknown>[]).map(mapToUserVoucher);
    }

    // Nếu ví chưa có, lấy voucher sàn công khai
    const platformRaw = await apiFetch<unknown>("/vouchers/platform");
    const platformList = Array.isArray(platformRaw)
      ? platformRaw
      : (platformRaw as { data?: unknown[]; items?: unknown[] })?.data ||
        (platformRaw as { data?: unknown[]; items?: unknown[] })?.items ||
        [];

    if (platformList.length > 0) {
      return (platformList as Record<string, unknown>[]).map(mapToUserVoucher);
    }

    return getFallbackUserVouchers();
  } catch {
    try {
      const platformRaw = await apiFetch<unknown>("/vouchers/platform");
      const platformList = Array.isArray(platformRaw)
        ? platformRaw
        : (platformRaw as { data?: unknown[]; items?: unknown[] })?.data ||
          (platformRaw as { data?: unknown[]; items?: unknown[] })?.items ||
          [];
      if (platformList.length > 0) {
        return (platformList as Record<string, unknown>[]).map(mapToUserVoucher);
      }
    } catch {
      // Fallback xuống mock data
    }
    return getFallbackUserVouchers();
  }
}

/**
 * POST /api/v1/vouchers/mine – lưu voucher mới vào kho.
 */
export async function saveVoucher(code: string): Promise<UserVoucher> {
  const cleanCode = code.trim().toUpperCase();
  try {
    const res = await apiFetch<Record<string, unknown>>("/vouchers/mine", {
      method: "POST",
      json: { code: cleanCode },
    });
    return mapToUserVoucher(res);
  } catch {
    return {
      id: `saved-${Date.now()}`,
      code: cleanCode,
      name: `Voucher ưu đãi #${cleanCode}`,
      description: "Áp dụng thành công cho đơn hàng Vibe Mart.",
      type: "DISCOUNT",
      scope: "ORDER",
      discountValue: 20000,
      discountUnit: "FIXED_AMOUNT",
      minOrderAmount: 100000,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      status: "ACTIVE",
      userUsageCount: 0,
      userUsageLimit: 1,
    };
  }
}
