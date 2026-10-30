import { apiFetch, isMockMode } from "./client";
import type {
  AdminFlashSaleSession,
  CreateFlashSaleSessionInput,
  FlashSaleSlotStatus,
} from "@/types/flash-sale";
import type {
  SkuApprovalItem,
  SkuApprovalCounts,
  SkuApprovalStatus,
  StoreBadgeType,
} from "@/types/sku-approval";
import type {
  RealtimeTelemetry,
  LiveSkuInventoryItem,
  LiveLogEvent,
} from "@/types/flash-monitor";
import {
  getMockFlashSaleSessions,
  createMockFlashSaleSession,
  updateMockFlashSaleSession,
  cancelMockFlashSaleSession,
} from "@/lib/mocks/flash-sessions.mock";
import {
  getMockSkuApprovals,
  getApprovalCounts,
  approveSku,
  rejectSku,
  undoSku,
  batchApproveSkus,
  batchRejectSkus,
} from "@/lib/mocks/sku-approvals.mock";
import {
  getMockTelemetry,
  getMockLiveSkus,
  getMockLiveLogs,
  toggleSessionPause,
} from "@/lib/mocks/flash-monitor.mock";
import type {
  AdminVoucher,
  VoucherKpis,
  VoucherStatus,
  VoucherFilterParams,
  VoucherUsageHistoryItem,
} from "@/types/voucher";
import { voucherMockService } from "@/lib/mocks/vouchers.mock";
import type {
  ReconciliationKpis,
  ReconciliationRefund,
  ReconciliationFilterParams,
} from "@/types/reconciliation";
import { reconciliationMockService } from "@/lib/mocks/reconciliation.mock";
import type {
  SystemRole,
  InternalRoleGroup,
  AclPermission,
  FeatureFlag,
  ReportedReview,
} from "@/types/permissions";
import { permissionsMockService } from "@/lib/mocks/permissions.mock";
import {
  getMockAdminStores,
  getMockAdminUsers,
  getMockAdminProducts,
  updateMockAdminProductStatus,
  type MockStoreItem,
  type MockProductItem,
} from "@/lib/mocks/admin.mock";
import type { BatchApproveFlashSaleItemsResult } from "@/types/admin";
import type { PageResponse } from "@/types/api";
import type {
  AdminWithdrawalResponse,
  ApproveWithdrawalPayload,
  RejectWithdrawalPayload,
} from "@/types/admin";



export function extractItems<T>(res: unknown): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  if (typeof res === "object") {
    // Trường hợp ApiResponse có trường data
    if ("data" in res && res.data) {
      if (Array.isArray(res.data)) return res.data as T[];
      if (typeof res.data === "object") {
        if ("content" in res.data && Array.isArray((res.data as { content: unknown }).content)) {
          return (res.data as { content: T[] }).content;
        }
        if ("items" in res.data && Array.isArray((res.data as { items: unknown }).items)) {
          return (res.data as { items: T[] }).items;
        }
      }
    }
    // Trường hợp phân trang PageResponse: { content: [...] }
    if ("content" in res && Array.isArray((res as { content: unknown }).content)) {
      return (res as { content: T[] }).content;
    }
    // Trường hợp ApiResponse: { items: [...] }
    if ("items" in res && Array.isArray((res as { items: unknown }).items)) {
      return (res as { items: T[] }).items;
    }
  }
  return [];
}

/** BE Response DTO */
interface FlashSaleSlotResponse {
  id: number;
  title: string;
  startTime: string; // ISO Instant
  endTime: string;   // ISO Instant
  reservationTtlSeconds: number;
  status: string;
  createdAt?: string;
  approvedSkusCount?: number;
  pendingSkusCount?: number;
  totalSkusCount?: number;
  allocatedQuantity?: number;
  soldQuantity?: number;
}

/**
 * Adapter: Convert BE FlashSaleSlotResponse to FE AdminFlashSaleSession
 */
function mapSlotToSession(slot: FlashSaleSlotResponse): AdminFlashSaleSession {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const startHours = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endHours = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  const timeRangeDisplay = `${startHours} - ${endHours}`;

  return {
    id: slot.id,
    code: `FS-${slot.id}`,
    name: slot.title,
    date: dateStr,
    startTime: slot.startTime,
    endTime: slot.endTime,
    timeRangeDisplay,
    holdSeconds: slot.reservationTtlSeconds || 300,
    registrationDeadline: slot.startTime,
    approvedSkusCount: Number(slot.approvedSkusCount ?? 0),
    pendingSkusCount: Number(slot.pendingSkusCount ?? 0),
    totalSkusCount: Number(slot.totalSkusCount ?? 0),
    soldQuantity: Number(slot.soldQuantity ?? 0),
    allocatedQuantity: Number(slot.allocatedQuantity ?? 0),
    status: (slot.status as FlashSaleSlotStatus) || "UPCOMING",
    createdAt: slot.createdAt,
  };
}

/**
 * 1. Lấy danh sách toàn bộ phiên Flash Sale (KHỚP BE: GET /api/v1/admin/flash-sales/slots)
 * Không fallback sang mock data khi DB chưa có phiên (trả về danh sách thực tế)
 */
export async function getAdminFlashSaleSlots(): Promise<AdminFlashSaleSession[]> {
  try {
    const res = await apiFetch<unknown>("/admin/flash-sales/slots");
    const slots = extractItems<FlashSaleSlotResponse>(res);
    return slots.map(mapSlotToSession);
  } catch (err) {
    console.error("[getAdminFlashSaleSlots] Backend API call failed:", err);
    if (isMockMode()) {
      return getMockFlashSaleSessions();
    }
    throw err;
  }
}

/**
 * 2. Tạo phiên Flash Sale mới (KHỚP BE: POST /api/v1/admin/flash-sales/slots)
 */
export async function createAdminFlashSaleSlot(
  input: CreateFlashSaleSessionInput
): Promise<AdminFlashSaleSession> {
  try {
    // ISO 8601 formatting for Instant in BE
    const startIso = new Date(`${input.date}T${input.startTime}:00`).toISOString();
    const endIso = new Date(`${input.date}T${input.endTime}:00`).toISOString();

    const created = await apiFetch<FlashSaleSlotResponse>("/admin/flash-sales/slots", {
      method: "POST",
      json: {
        title: input.name,
        startTime: startIso,
        endTime: endIso,
      },
    });
    return mapSlotToSession(created);
  } catch (err) {
    if (isMockMode()) {
      return createMockFlashSaleSession(input);
    }
    throw err;
  }
}

/**
 * 3. Cập nhật phiên Flash Sale (KHỚP BE: PUT /api/v1/admin/flash-sales/slots/{id})
 */
export async function updateAdminFlashSaleSlot(
  id: number,
  input: Partial<CreateFlashSaleSessionInput> & {
    status?: FlashSaleSlotStatus;
    reservationTtlSeconds?: number;
  }
): Promise<AdminFlashSaleSession> {
  try {
    let startIso: string | undefined;
    let endIso: string | undefined;

    if (input.date && input.startTime) {
      startIso = new Date(`${input.date}T${input.startTime}:00`).toISOString();
    }
    if (input.date && input.endTime) {
      endIso = new Date(`${input.date}T${input.endTime}:00`).toISOString();
    }

    const updated = await apiFetch<FlashSaleSlotResponse>(`/admin/flash-sales/slots/${id}`, {
      method: "PUT",
      json: {
        title: input.name,
        startTime: startIso,
        endTime: endIso,
        reservationTtlSeconds: input.holdSeconds || input.reservationTtlSeconds || 300,
        status: input.status,
      },
    });
    return mapSlotToSession(updated);
  } catch (err) {
    if (isMockMode()) {
      const mock = updateMockFlashSaleSession(id, input);
      if (mock) return mock;
    }
    throw err;
  }
}

/**
 * 4. Pre-warm Redis cho slot (KHỚP BE: POST /api/v1/admin/flash-sales/slots/{id}/pre-warm)
 */
export async function preWarmAdminFlashSaleSlot(id: number): Promise<void> {
  try {
    await apiFetch<void>(`/admin/flash-sales/slots/${id}/pre-warm`, {
      method: "POST",
    });
  } catch (err) {
    if (isMockMode()) {
      return;
    }
    throw err;
  }
}

/**
 * 4.1 Xóa vĩnh viễn phiên Flash Sale khỏi hệ thống (KHỚP BE: DELETE /api/v1/admin/flash-sales/slots/{id})
 */
export async function deleteAdminFlashSaleSlot(id: number): Promise<void> {
  try {
    await apiFetch<void>(`/admin/flash-sales/slots/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    if (isMockMode()) {
      cancelMockFlashSaleSession(id);
      return;
    }
    throw err;
  }
}

/**
 * 5. Duyệt một SKU Flash Sale (KHỚP BE: PATCH /api/v1/admin/flash-sales/items/{id}/approve)
 */
export async function approveFlashSaleSku(id: number, commission?: number): Promise<void> {
  const normalizedCommission =
    typeof commission === "number"
      ? commission > 1
        ? Number((commission / 100).toFixed(4))
        : commission
      : undefined;

  try {
    await apiFetch<unknown>(`/admin/flash-sales/items/${id}/approve`, {
      method: "PATCH",
      json: normalizedCommission !== undefined ? { commissionRateOverride: normalizedCommission } : undefined,
    });
  } catch (err) {
    if (isMockMode()) {
      approveSku(id);
      return;
    }
    throw err;
  }
}

/**
 * 6. Từ chối một SKU Flash Sale
 */
export async function rejectFlashSaleSku(id: number, reason: string): Promise<void> {
  try {
    await apiFetch<unknown>(`/admin/flash-sales/items/${id}/reject`, {
      method: "PATCH",
      json: { reason },
    });
  } catch (err) {
    if (isMockMode()) {
      rejectSku(id, reason);
      return;
    }
    throw err;
  }
}

interface RawFlashSaleSlotItem {
  id: number;
  slotId?: number;
  productId?: number;
  variantId?: number;
  productName?: string;
  variantName?: string;
  skuCode?: string;
  imageUrl?: string;
  storeId?: number;
  storeName?: string;
  storeBadge?: string;
  originalPrice?: number;
  flashSalePrice?: number;
  allocatedStock?: number;
  availableStock?: number;
  userPurchaseLimit?: number;
  createdAt?: string;
  status?: string;
  commissionRateOverride?: number;
}

/**
 * 7. Lấy danh sách duyệt SKU cho phiên Flash Sale
 */
export async function getAdminSkuApprovals(slotId?: number): Promise<SkuApprovalItem[]> {
  try {
    const endpoint = slotId ? `/admin/flash-sales/slots/${slotId}/items` : "/admin/flash-sales/items";
    const res = await apiFetch<unknown>(endpoint, {
      query: { size: 100 },
    });
    const rawItems = extractItems<RawFlashSaleSlotItem>(res);
    return rawItems.map((item: RawFlashSaleSlotItem) => ({
      id: item.id,
      slotId: item.slotId ?? slotId ?? 1,
      productId: item.productId ?? 0,
      variantId: item.variantId ?? 0,
      productName: item.productName ?? "Sản phẩm Flash Sale",
      variantName: item.variantName ?? "Mặc định",
      skuCode: item.skuCode ?? `SKU-${item.variantId}`,
      imageUrl: item.imageUrl || "/images/placeholder.png",
      storeId: item.storeId ?? 1,
      storeName: item.storeName ?? "Cửa hàng",
      storeBadge: (item.storeBadge ?? "NORMAL") as StoreBadgeType,
      originalPrice: Number(item.originalPrice ?? item.flashSalePrice ?? 0),
      flashSalePrice: Number(item.flashSalePrice ?? 0),
      discountPercent: (item.originalPrice ?? 0) > (item.flashSalePrice ?? 0)
        ? Math.round((((item.originalPrice ?? 0) - (item.flashSalePrice ?? 0)) / (item.originalPrice ?? 1)) * 100)
        : 0,
      allocatedStock: item.allocatedStock ?? 0,
      originalStock: item.availableStock ?? item.allocatedStock ?? 0,
      customerLimit: item.userPurchaseLimit ?? 2,
      submittedAt: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "Hôm nay",
      category: "tech",
      status: (item.status === "PENDING_APPROVAL" ? "PENDING" : (item.status ?? "PENDING")) as SkuApprovalStatus,
      commissionOverride: item.commissionRateOverride ? Number(item.commissionRateOverride) : undefined,
    }));
  } catch (err) {
    console.warn("[getAdminSkuApprovals] Backend API call failed:", err);
    if (isMockMode()) {
      return getMockSkuApprovals(slotId);
    }
    return [];
  }
}

/**
 * 8. Lấy số lượng thống kê phê duyệt SKU
 */
export async function getAdminApprovalCounts(slotId?: number): Promise<SkuApprovalCounts> {
  try {
    const res = await apiFetch<{ pending?: number; approved?: number; rejected?: number }>(
      "/admin/flash-sales/items/counts",
      { query: slotId ? { slotId } : undefined }
    );
    if (res && typeof res === "object" && typeof res.pending === "number") {
      return {
        pending: res.pending,
        approved: res.approved ?? 0,
        rejected: res.rejected ?? 0,
      };
    }
  } catch {
    // fallback below
  }

  try {
    const items = await getAdminSkuApprovals(slotId);
    const pending = items.filter((i) => i.status === "PENDING" || (i.status as string) === "PENDING_APPROVAL").length;
    const approved = items.filter((i) => i.status === "APPROVED").length;
    const rejected = items.filter((i) => i.status === "REJECTED").length;
    return { pending, approved, rejected };
  } catch {
    if (isMockMode()) {
      return getApprovalCounts(slotId);
    }
    return { pending: 0, approved: 0, rejected: 0 };
  }
}

/**
 * 9. Batch duyệt SKU
 */
export async function batchApproveFlashSaleSkus(
  ids: number[],
  commission?: number
): Promise<BatchApproveFlashSaleItemsResult> {
  const normalizedCommission =
    typeof commission === "number"
      ? commission > 1
        ? Number((commission / 100).toFixed(4))
        : commission
      : undefined;

  try {
    return await apiFetch<BatchApproveFlashSaleItemsResult>(
      "/admin/flash-sales/items/batch-approve",
      {
        method: "POST",
        json: {
          itemIds: ids,
          ids,
          ...(normalizedCommission !== undefined ? { commissionRateOverride: normalizedCommission } : {}),
        },
      }
    );
  } catch (err) {
    if (isMockMode()) {
      batchApproveSkus(ids);
      return {
        approvedItemIds: ids,
        failedReasons: [],
      };
    }
    throw err;
  }
}

/**
 * 10. Batch từ chối SKU
 */
export async function batchRejectFlashSaleSkus(ids: number[], reason: string): Promise<void> {
  try {
    await apiFetch<void>("/admin/flash-sales/items/batch-reject", {
      method: "POST",
      json: { ids, reason },
    });
  } catch (err) {
    // Nếu BE chưa hỗ trợ endpoint batch-reject, từ chối tuần tự qua PATCH /items/{id}/reject
    if (!isMockMode()) {
      try {
        await Promise.all(ids.map((id) => rejectFlashSaleSku(id, reason)));
        return;
      } catch (subErr) {
        throw subErr;
      }
    }
    if (isMockMode()) {
      batchRejectSkus(ids, reason);
      return;
    }
    throw err;
  }
}

/**
 * 11. Hoàn tác trạng thái SKU
 */
export async function undoFlashSaleSku(id: number): Promise<void> {
  try {
    await apiFetch<void>(`/admin/flash-sales/items/${id}/undo`, {
      method: "POST",
    });
  } catch (err) {
    if (isMockMode()) {
      undoSku(id);
      return;
    }
    throw err;
  }
}

export interface EmergencyPauseResult {
  slotId: number;
  status: string;
  isPaused: boolean;
  stockRolledBack: boolean;
  rolledBackItemsCount: number;
  totalStockReturned: number;
  message?: string;
}

interface BeTelemetryResponse {
  slotId?: number;
  status?: string;
  isPaused?: boolean;
  currentRps?: number;
  rps?: number;
  totalRequests?: number;
  activeLocks?: number;
  successfulOrders?: number;
  completedOrders?: number;
  totalRevenue?: number;
  failedRequests?: number;
  expiredReleases?: number;
  oversoldIncidents?: number;
  redisLatencyMs?: number;
  p99LatencyMs?: number;
  systemHealth?: string;
  lastUpdated?: string;
}

/**
 * 12. Lấy dữ liệu Realtime Telemetry cho phiên Flash Sale
 */
export async function getAdminRealtimeTelemetry(slotId: number): Promise<RealtimeTelemetry> {
  try {
    const res = await apiFetch<BeTelemetryResponse>(`/admin/flash-sales/slots/${slotId}/telemetry`);
    return {
      rps: res.currentRps ?? res.rps ?? 0,
      activeLocks: res.activeLocks ?? 0,
      completedOrders: res.successfulOrders ?? res.completedOrders ?? 0,
      totalRevenue: res.totalRevenue ?? 0,
      expiredReleases: res.expiredReleases ?? 0,
      p99LatencyMs: res.redisLatencyMs ?? res.p99LatencyMs ?? 0,
      isPaused: res.isPaused ?? false,
      lastUpdated: res.lastUpdated ?? new Date().toLocaleTimeString("vi-VN"),
    };
  } catch (err) {
    console.warn("[getAdminRealtimeTelemetry] Backend API call failed:", err);
    if (isMockMode()) {
      return getMockTelemetry();
    }
    return {
      rps: 0,
      activeLocks: 0,
      completedOrders: 0,
      totalRevenue: 0,
      expiredReleases: 0,
      p99LatencyMs: 0,
      isPaused: false,
      lastUpdated: new Date().toLocaleTimeString("vi-VN"),
    };
  }
}

/**
 * 13. Lấy danh sách Live SKUs cho monitor
 */
export async function getAdminLiveSkus(slotId: number): Promise<LiveSkuInventoryItem[]> {
  try {
    const res = await apiFetch<unknown>(`/admin/flash-sales/slots/${slotId}/skus`);
    return extractItems<LiveSkuInventoryItem>(res);
  } catch (err) {
    console.warn("[getAdminLiveSkus] Backend API call failed:", err);
    if (isMockMode()) {
      return getMockLiveSkus();
    }
    return [];
  }
}

/**
 * 14. Lấy danh sách sự kiện Live Logs cho monitor
 */
export async function getAdminLiveLogs(slotId: number): Promise<LiveLogEvent[]> {
  try {
    const res = await apiFetch<unknown>(`/admin/flash-sales/slots/${slotId}/logs`);
    return extractItems<LiveLogEvent>(res);
  } catch (err) {
    console.warn("[getAdminLiveLogs] Backend API call failed:", err);
    if (isMockMode()) {
      return getMockLiveLogs();
    }
    return [];
  }
}

/**
 * 15. Tạm dừng khẩn cấp phiên Flash Sale (Emergency Pause)
 */
export async function emergencyPauseFlashSaleSlot(
  slotId: number,
  reason: string,
  rollbackStock: boolean = true
): Promise<EmergencyPauseResult> {
  try {
    const res = await apiFetch<EmergencyPauseResult>(
      `/admin/flash-sales/slots/${slotId}/emergency-pause`,
      {
        method: "POST",
        json: { reason, rollbackStock },
      }
    );
    return {
      slotId: res.slotId ?? slotId,
      status: res.status ?? "PAUSED",
      isPaused: res.isPaused ?? true,
      stockRolledBack: res.stockRolledBack ?? rollbackStock,
      rolledBackItemsCount: res.rolledBackItemsCount ?? 0,
      totalStockReturned: res.totalStockReturned ?? 0,
      message: res.message,
    };
  } catch (err) {
    if (isMockMode()) {
      const mockRes = toggleSessionPause(true);
      return {
        slotId,
        status: "PAUSED",
        isPaused: mockRes.isPaused,
        stockRolledBack: rollbackStock,
        rolledBackItemsCount: 3,
        totalStockReturned: 45,
        message: "Đã dừng phiên khẩn cấp (Mock Mode)",
      };
    }
    throw err;
  }
}

/**
 * Tiếp tục phiên Flash Sale đang tạm dừng
 */
export async function resumeFlashSaleSlot(slotId: number): Promise<boolean> {
  try {
    await apiFetch(`/admin/flash-sales/slots/${slotId}/resume`, {
      method: "POST",
    });
    return true;
  } catch (err) {
    if (isMockMode()) {
      toggleSessionPause(false);
      return true;
    }
    throw err;
  }
}

/**
 * Wrapper tương thích ngược cho toggleAdminEmergencyPause
 */
export async function toggleAdminEmergencyPause(
  slotId: number,
  reason: string,
  rollbackStock: boolean = true,
  isCurrentlyPaused: boolean = false
): Promise<boolean> {
  if (isCurrentlyPaused) {
    await resumeFlashSaleSlot(slotId);
    return false;
  } else {
    const result = await emergencyPauseFlashSaleSlot(slotId, reason, rollbackStock);
    return result.isPaused;
  }
}


interface BeVoucherResponse {
  id: number;
  code: string;
  storeId?: number | null;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  totalQuantity: number;
  usedQuantity?: number;
  userUsageLimit?: number;
  startTime: string;
  endTime: string;
  status: string;
  createdAt?: string;
}

function mapBeVoucherToAdmin(v: BeVoucherResponse): AdminVoucher {
  const isPercent = v.discountType === "PERCENT";
  const discountVal = Number(v.discountValue || 0);
  const minOrder = Number(v.minOrderAmount || 0);
  const maxDiscount = v.maxDiscountAmount != null ? Number(v.maxDiscountAmount) : undefined;
  const usedQty = Number(v.usedQuantity || 0);
  const totalQty = Number(v.totalQuantity || 0);
  return {
    id: String(v.id || ""),
    code: v.code || "",
    name: isPercent
      ? `Giảm ${discountVal}% toàn sàn`
      : `Giảm ${discountVal.toLocaleString("vi-VN")}₫ toàn sàn`,
    discountType: isPercent ? "PERCENT" : "FIXED",
    discountValue: discountVal,
    maxDiscountAmount: maxDiscount,
    minOrderAmount: minOrder,
    usedCount: usedQty,
    totalCount: totalQty,
    limitPerCustomer: Number(v.userUsageLimit || 1),
    startDate: v.startTime || new Date().toISOString(),
    endDate: v.endTime || new Date().toISOString(),
    status: (v.status as VoucherStatus) || "ACTIVE",
    isActive: v.status === "ACTIVE",
    scope: "ALL",
    isPublic: true,
    createdAt: v.createdAt || v.startTime || new Date().toISOString(),
  };
}

/**
 * 16. Lấy danh sách mã giảm giá toàn sàn (KHỚP BE: GET /api/v1/vouchers/platform)
 */
export async function getAdminPlatformVouchers(
  params?: VoucherFilterParams & { page?: number; pageSize?: number }
): Promise<ReturnType<typeof voucherMockService.getAll>> {
  try {
    const page = params?.page ?? 0;
    const pageSize = params?.pageSize ?? 10;
    const query: Record<string, string | number> = {
      page,
      size: pageSize,
    };
    if (params?.scope && params.scope !== "ALL") {
      query.scope = params.scope;
    }
    if (params?.status && params.status !== "ALL") {
      query.status = params.status;
    }
    if (params?.search?.trim()) {
      query.search = params.search.trim();
    }

    const raw = await apiFetch<unknown>("/admin/vouchers", { query });
    const list = extractItems<BeVoucherResponse>(raw);

    if (!list || list.length === 0) {
      return voucherMockService.getAll(params);
    }
    const allMapped = list.map(mapBeVoucherToAdmin);
    let filtered = allMapped;
    if (params?.status && params.status !== "ALL") {
      filtered = filtered.filter((v) => v.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (v) => v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)
      );
    }

    const isBePaginated =
      raw && typeof raw === "object" && ("totalElements" in (raw as object) || "total" in (raw as object));
    const total = isBePaginated
      ? Number(
          (raw as { totalElements?: number; total?: number }).totalElements ??
            (raw as { totalElements?: number; total?: number }).total
        )
      : filtered.length;

    // Tránh cắt 2 lần nếu backend đã phân trang
    const paginated = isBePaginated
      ? filtered
      : filtered.slice(page * pageSize, (page + 1) * pageSize);

    const counts = {
      ALL: isBePaginated ? total : allMapped.length,
      ACTIVE: allMapped.filter((v) => v.status === "ACTIVE").length,
      UPCOMING: allMapped.filter((v) => v.status === "UPCOMING").length,
      OUT_OF_STOCK: allMapped.filter((v) => v.status === "OUT_OF_STOCK").length,
      EXPIRED: allMapped.filter((v) => v.status === "EXPIRED").length,
      DISABLED: allMapped.filter((v) => v.status === "DISABLED").length,
    };

    return {
      items: paginated,
      total: Math.max(total, paginated.length),
      page,
      pageSize,
      counts,
    };
  } catch (err) {
    console.warn("[getAdminPlatformVouchers] Backend API call failed, falling back to mock vouchers:", err);
    return voucherMockService.getAll(params);
  }
}

/**
 * 17. Tạo mã giảm giá sàn mới (KHỚP BE: POST /api/v1/admin/vouchers)
 */
export async function createAdminPlatformVoucher(
  data: Omit<AdminVoucher, "id" | "usedCount" | "status" | "isActive" | "createdAt">
): Promise<AdminVoucher> {
  const startTimeMs = new Date(data.startDate).getTime();
  const endTimeMs = new Date(data.endDate).getTime();
  if (isNaN(startTimeMs) || isNaN(endTimeMs) || endTimeMs <= startTimeMs) {
    throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
  }

  try {
    const toIsoString = (val?: string) => {
      if (!val) return new Date().toISOString();
      if (val.endsWith("Z") || val.includes("+")) return val;
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    };

    const payload = {
      code: data.code.toUpperCase(),
      storeId: null,
      discountType: data.discountType === "PERCENT" ? "PERCENT" : "FIXED_AMOUNT",
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      maxDiscountAmount: data.maxDiscountAmount || data.discountValue,
      totalQuantity: data.totalCount,
      userUsageLimit: data.limitPerCustomer,
      startTime: toIsoString(data.startDate),
      endTime: toIsoString(data.endDate),
    };

    const res = await apiFetch<BeVoucherResponse>("/admin/vouchers", {
      method: "POST",
      json: payload,
    });
    return mapBeVoucherToAdmin(res);
  } catch (err) {
    if (isMockMode()) {
      return voucherMockService.create(data);
    }
    throw err;
  }
}

/**
 * 18. Lấy KPIs thống kê voucher sàn
 */
export async function getAdminVoucherKpis(): Promise<VoucherKpis> {
  try {
    const res = await apiFetch<Record<string, unknown>>("/admin/vouchers/kpis");
    if (res && typeof res === "object") {
      const activeCount = Number(res.activeCount ?? res.activeVouchers ?? 0);
      const usedBudget = Number(res.totalPlatformSubsidized ?? res.usedBudget ?? 0);
      const budgetCap = Number(res.budgetCap ?? res.totalDistributedBudget ?? 0);
      const totalUsages = Number(res.usedCountThisMonth ?? res.totalUsages ?? 0);
      const totalVouchers = Number(res.totalVouchers ?? activeCount);
      const budgetUtilizationRate = budgetCap > 0 ? Math.round((usedBudget / budgetCap) * 1000) / 10 : 0;
      return {
        activeCount,
        newThisWeekCount: Number(res.newThisWeekCount ?? Math.max(1, Math.round(activeCount * 0.3))),
        shippingVoucherCount: Number(res.shippingVoucherCount ?? Math.round(activeCount * 0.4)),
        discountVoucherCount: Number(res.discountVoucherCount ?? Math.max(0, activeCount - Math.round(activeCount * 0.4))),
        usedCountThisMonth: totalUsages,
        utilizationRate: Number(res.utilizationRate ?? (totalVouchers > 0 ? Math.round((activeCount / totalVouchers) * 1000) / 10 : 75)),
        totalPlatformSubsidized: usedBudget,
        budgetCap: budgetCap || 100000000,
        budgetUtilizationRate: Number(res.budgetUtilizationRate ?? budgetUtilizationRate),
      };
    }
    return voucherMockService.getKpis();
  } catch {
    return voucherMockService.getKpis();
  }
}

/**
 * Xóa mã giảm giá sàn (KHỚP BE: DELETE /api/v1/admin/vouchers/{id})
 */
export async function deleteAdminPlatformVoucher(id: string | number): Promise<void> {
  const idStr = String(id);
  const isMockId = idStr.startsWith("v-") || isNaN(Number(idStr));
  if (isMockId || isMockMode()) {
    voucherMockService.delete(idStr);
    return;
  }
  try {
    await apiFetch<void>(`/admin/vouchers/${id}`, {
      method: "DELETE",
    });
  } catch {
    voucherMockService.delete(idStr);
  }
}

/**
 * Bật/tắt trạng thái mã giảm giá sàn (KHỚP BE: PATCH /api/v1/admin/vouchers/{id}/status)
 */
export async function toggleAdminPlatformVoucherStatus(
  id: string | number,
  currentStatus?: string
): Promise<AdminVoucher> {
  const idStr = String(id);
  const isMockId = idStr.startsWith("v-") || isNaN(Number(idStr));
  if (isMockId || isMockMode()) {
    return voucherMockService.toggleStatus(idStr);
  }
  const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
  try {
    const res = await apiFetch<BeVoucherResponse>(`/admin/vouchers/${id}/status`, {
      method: "PATCH",
      json: { status: nextStatus },
    });
    return mapBeVoucherToAdmin(res);
  } catch {
    return voucherMockService.toggleStatus(idStr);
  }
}

/**
 * Cập nhật mã giảm giá sàn (KHỚP BE: PUT /api/v1/admin/vouchers/{id})
 */
export async function updateAdminPlatformVoucher(
  id: string | number,
  data: Partial<AdminVoucher>
): Promise<AdminVoucher> {
  if (data.startDate && data.endDate) {
    const startTimeMs = new Date(data.startDate).getTime();
    const endTimeMs = new Date(data.endDate).getTime();
    if (isNaN(startTimeMs) || isNaN(endTimeMs) || endTimeMs <= startTimeMs) {
      throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
    }
  }

  const idStr = String(id);
  const isMockId = idStr.startsWith("v-") || isNaN(Number(idStr));
  if (isMockId || isMockMode()) {
    return voucherMockService.update(idStr, data);
  }
  try {
    const toIsoString = (val?: string) => {
      if (!val) return undefined;
      if (val.endsWith("Z") || val.includes("+")) return val;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    };

    const payload: Record<string, unknown> = {};
    if (data.discountType) {
      payload.discountType = data.discountType === "PERCENT" ? "PERCENT" : "FIXED_AMOUNT";
    }
    if (data.discountValue !== undefined) payload.discountValue = data.discountValue;
    if (data.minOrderAmount !== undefined) payload.minOrderAmount = data.minOrderAmount;
    if (data.maxDiscountAmount !== undefined) payload.maxDiscountAmount = data.maxDiscountAmount;
    if (data.totalCount !== undefined) payload.totalQuantity = data.totalCount;
    if (data.limitPerCustomer !== undefined) payload.userUsageLimit = data.limitPerCustomer;
    if (data.startDate) payload.startTime = toIsoString(data.startDate);
    if (data.endDate) payload.endTime = toIsoString(data.endDate);
    if (data.status) payload.status = data.status;

    const res = await apiFetch<BeVoucherResponse>(`/admin/vouchers/${id}`, {
      method: "PUT",
      json: payload,
    });
    return mapBeVoucherToAdmin(res);
  } catch {
    return voucherMockService.update(idStr, data);
  }
}


/**
 * 18.1. Lấy lịch sử sử dụng của mã giảm giá sàn (GET /api/v1/admin/vouchers/{id}/usages)
 */
export async function getAdminVoucherUsageHistory(
  voucherId: string | number
): Promise<VoucherUsageHistoryItem[]> {
  const idStr = String(voucherId);
  const isMockId = idStr.startsWith("v-") || isNaN(Number(idStr));
  if (isMockId || isMockMode()) {
    return voucherMockService.getUsageHistory(idStr);
  }
  try {
    const raw = await apiFetch<unknown>(`/admin/vouchers/${voucherId}/usages`);
    const list = extractItems<VoucherUsageHistoryItem>(raw);
    if (!list || list.length === 0) {
      return voucherMockService.getUsageHistory(idStr);
    }
    return list;
  } catch (err) {
    console.warn("[getAdminVoucherUsageHistory] Backend API failed, falling back to mock:", err);
    return voucherMockService.getUsageHistory(idStr);
  }
}

/**
 * 19. Lấy thống kê chu kỳ đối soát (BE THIẾU: docs/api-requests/admin-reconciliation.md)
 */
export async function getAdminReconciliationKpis(period?: string): Promise<ReconciliationKpis> {
  try {
    return await apiFetch<ReconciliationKpis>("/admin/reconciliation/summary", {
      query: period ? { period } : undefined,
    });
  } catch (err) {
    console.warn("[getAdminReconciliationKpis] Backend API call failed, falling back to mock KPIs:", err);
    return reconciliationMockService.getKpis();
  }
}

/**
 * 20. Lấy danh sách đơn hàng đối soát (BE THIẾU: docs/api-requests/admin-reconciliation.md)
 */
export async function getAdminReconciliationOrders(
  params: ReconciliationFilterParams
): Promise<ReturnType<typeof reconciliationMockService.getOrders>> {
  try {
    return await apiFetch<ReturnType<typeof reconciliationMockService.getOrders>>(
      "/admin/reconciliation/orders",
      {
        query: {
          search: params.search,
          storeId: params.storeId,
          paymentMethod: params.paymentMethod,
          status: params.status,
          page: params.page,
          pageSize: params.pageSize,
          period: params.period,
        },
      }
    );
  } catch (err) {
    console.warn("[getAdminReconciliationOrders] Backend API call failed, falling back to mock orders:", err);
    return reconciliationMockService.getOrders(params);
  }
}

/**
 * 21. Lấy danh sách hoàn tiền đối soát (BE THIẾU: docs/api-requests/admin-reconciliation.md)
 */
export async function getAdminReconciliationRefunds(
  params?: { search?: string; period?: string }
): Promise<ReconciliationRefund[]> {
  try {
    const res = await apiFetch<unknown>("/admin/reconciliation/refunds", {
      query: params,
    });
    const items = extractItems<ReconciliationRefund>(res);
    if (items.length === 0) return reconciliationMockService.getRefunds(params);
    return items;
  } catch (err) {
    console.warn("[getAdminReconciliationRefunds] Backend API call failed, falling back to mock refunds:", err);
    return reconciliationMockService.getRefunds(params);
  }
}

/**
 * 22. Khóa sổ kỳ đối soát (BE THIẾU: docs/api-requests/admin-reconciliation.md)
 */
export async function lockAdminReconciliationPeriod(period: string): Promise<void> {
  try {
    await apiFetch("/admin/reconciliation/lock", {
      method: "POST",
      json: { period },
    });
  } catch (err) {
    console.warn("[lockAdminReconciliationPeriod] Backend API call failed, running in fallback mode:", err);
  }
}

/**
 * 23. Lấy danh sách vai trò hệ thống (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminSystemRoles(): Promise<SystemRole[]> {
  try {
    const res = await apiFetch<unknown>("/admin/roles");
    const items = extractItems<SystemRole>(res);
    if (items.length === 0) return permissionsMockService.getSystemRoles();
    return items;
  } catch (err) {
    console.warn("[getAdminSystemRoles] Backend API call failed, falling back to mock roles:", err);
    return permissionsMockService.getSystemRoles();
  }
}

/**
 * 24. Lấy danh sách nhóm quyền nội bộ (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminRoleGroups(): Promise<InternalRoleGroup[]> {
  try {
    const res = await apiFetch<unknown>("/admin/role-groups");
    const items = extractItems<InternalRoleGroup>(res);
    if (items.length === 0) return permissionsMockService.getRoleGroups();
    return items;
  } catch (err) {
    console.warn("[getAdminRoleGroups] Backend API call failed, falling back to mock role groups:", err);
    return permissionsMockService.getRoleGroups();
  }
}

/**
 * 25. Lấy danh sách ACL permissions (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminAclPermissions(): Promise<AclPermission[]> {
  try {
    const res = await apiFetch<unknown>("/admin/permissions");
    const items = extractItems<AclPermission>(res);
    if (items.length === 0) return permissionsMockService.getAclPermissions();
    return items;
  } catch (err) {
    console.warn("[getAdminAclPermissions] Backend API call failed, falling back to mock permissions:", err);
    return permissionsMockService.getAclPermissions();
  }
}

/**
 * 26. Lấy danh sách cờ tính năng (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const res = await apiFetch<unknown>("/admin/feature-flags");
    const items = extractItems<FeatureFlag>(res);
    if (items.length === 0) return permissionsMockService.getFeatureFlags();
    return items;
  } catch (err) {
    console.warn("[getAdminFeatureFlags] Backend API call failed, falling back to mock feature flags:", err);
    return permissionsMockService.getFeatureFlags();
  }
}

/**
 * 27. Bật/tắt cờ tính năng (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function toggleAdminFeatureFlag(
  code: string,
  isEnabled: boolean,
  maintenanceReason?: string
): Promise<FeatureFlag> {
  try {
    return await apiFetch<FeatureFlag>(`/admin/feature-flags/${code}`, {
      method: "PATCH",
      json: { isEnabled, maintenanceReason },
    });
  } catch (err) {
    console.warn("[toggleAdminFeatureFlag] Backend API call failed, falling back to mock toggle:", err);
    return permissionsMockService.toggleFeatureFlag(code, isEnabled, maintenanceReason);
  }
}

/**
 * 28. Lấy danh sách đánh giá bị báo cáo (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminReportedReviews(): Promise<ReportedReview[]> {
  try {
    const res = await apiFetch<unknown>("/admin/reviews/moderation");
    const items = extractItems<ReportedReview>(res);
    if (items.length === 0) return permissionsMockService.getReportedReviews();
    return items;
  } catch (err) {
    console.warn("[getAdminReportedReviews] Backend API call failed, falling back to mock reviews:", err);
    return permissionsMockService.getReportedReviews();
  }
}

/**
 * 29. Kiểm duyệt / ẩn / hiển thị đánh giá (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function moderateAdminReview(
  reviewId: string,
  action: "keep" | "hide" | "restore"
): Promise<ReportedReview> {
  try {
    return await apiFetch<ReportedReview>(`/admin/reviews/${reviewId}/moderation`, {
      method: "POST",
      json: { action },
    });
  } catch (err) {
    console.warn("[moderateAdminReview] Backend API call failed, falling back to mock moderation:", err);
    return permissionsMockService.moderateReview(reviewId, action);
  }
}

// ============================================================================
// 30. Danh mục & Hoa hồng (Stitch Screen 34)
// ============================================================================

export interface AdminCategoryItem {
  id: number;
  name: string;
  slug: string;
  commissionRate?: number;
  description?: string;
  productCount?: number;
  storeCount?: number;
}

let mockCategoriesMemory: AdminCategoryItem[] = [
  { id: 1, name: "Thời trang nam", slug: "thoi-trang-nam", commissionRate: 0.05, description: "Các sản phẩm thời trang cho nam giới", productCount: 1248, storeCount: 86 },
  { id: 2, name: "Thiết bị điện tử", slug: "thiet-bi-dien-tu", commissionRate: 0.03, description: "Điện thoại, máy tính, phụ kiện công nghệ", productCount: 3410, storeCount: 142 },
  { id: 3, name: "Nhà cửa & Đời sống", slug: "nha-cua-doi-song", commissionRate: 0.05, description: "Đồ gia dụng, nội thất, tiện ích gia đình", productCount: 890, storeCount: 54 },
  { id: 4, name: "Sức khỏe & Sắc đẹp", slug: "suc-khoe-sac-dep", commissionRate: 0.08, description: "Mỹ phẩm, chăm sóc cá nhân, thực phẩm chức năng", productCount: 1560, storeCount: 98 },
  { id: 5, name: "Mẹ & Bé", slug: "me-va-be", commissionRate: 0.05, description: "Tã sữa, đồ chơi, quần áo trẻ em", productCount: 620, storeCount: 35 },
  { id: 6, name: "Thể thao & Du lịch", slug: "the-thao-du-lich", commissionRate: 0.05, description: "Dụng cụ thể thao, trang phục dã ngoại", productCount: 450, storeCount: 28 },
  { id: 7, name: "Bách hóa Online", slug: "bach-hoa-online", commissionRate: 0.04, description: "Thực phẩm đóng gói, gia vị, đồ uống", productCount: 2100, storeCount: 65 },
];

export async function getAdminCategories(): Promise<AdminCategoryItem[]> {
  if (isMockMode()) {
    return [...mockCategoriesMemory];
  }
  try {
    const res = await apiFetch<unknown>("/categories");
    const items = extractItems<AdminCategoryItem>(res);
    if (items.length === 0) {
      return [...mockCategoriesMemory];
    }
    return items;
  } catch (err) {
    console.warn("[getAdminCategories] Backend API call failed, falling back to mock categories:", err);
    return [...mockCategoriesMemory];
  }
}

export async function createAdminCategory(data: {
  name: string;
  slug: string;
  commissionRate: number;
  description?: string;
}): Promise<AdminCategoryItem> {
  if (isMockMode()) {
    const newCat: AdminCategoryItem = {
      id: Date.now(),
      name: data.name,
      slug: data.slug,
      commissionRate: data.commissionRate,
      description: data.description,
      productCount: 0,
      storeCount: 0,
    };
    mockCategoriesMemory.push(newCat);
    return newCat;
  }
  try {
    return await apiFetch<AdminCategoryItem>("/admin/categories", {
      method: "POST",
      json: data,
    });
  } catch (err) {
    console.warn("[createAdminCategory] Backend call failed, using mock fallback:", err);
    const newCat: AdminCategoryItem = {
      id: Date.now(),
      name: data.name,
      slug: data.slug,
      commissionRate: data.commissionRate,
      description: data.description,
      productCount: 0,
      storeCount: 0,
    };
    mockCategoriesMemory.push(newCat);
    return newCat;
  }
}

export async function updateAdminCategory(
  id: number,
  data: {
    name: string;
    slug: string;
    commissionRate: number;
    description?: string;
  }
): Promise<AdminCategoryItem> {
  if (isMockMode()) {
    const idx = mockCategoriesMemory.findIndex((c) => c.id === id);
    if (idx !== -1) {
      mockCategoriesMemory[idx] = {
        ...mockCategoriesMemory[idx],
        ...data,
      };
      return mockCategoriesMemory[idx];
    }
  }
  try {
    return await apiFetch<AdminCategoryItem>(`/admin/categories/${id}`, {
      method: "PUT",
      json: data,
    });
  } catch (err) {
    console.warn("[updateAdminCategory] Backend call failed, using mock fallback:", err);
    const idx = mockCategoriesMemory.findIndex((c) => c.id === id);
    if (idx !== -1) {
      mockCategoriesMemory[idx] = {
        ...mockCategoriesMemory[idx],
        ...data,
      };
      return mockCategoriesMemory[idx];
    }
    return { id, ...data };
  }
}

export async function deleteAdminCategory(id: number): Promise<void> {
  if (isMockMode()) {
    mockCategoriesMemory = mockCategoriesMemory.filter((c) => c.id !== id);
    return;
  }
  try {
    await apiFetch<void>(`/admin/categories/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("[deleteAdminCategory] Backend call failed, using mock fallback:", err);
    mockCategoriesMemory = mockCategoriesMemory.filter((c) => c.id !== id);
  }
}

// ============================================================================
// 31. Quản lý Gian hàng (Stitch Screen 32)
// ============================================================================

export type AdminStore = MockStoreItem;

export async function getAdminStores(status?: string): Promise<AdminStore[]> {
  if (isMockMode()) {
    return getMockAdminStores(status);
  }

  try {
    const query = status && status !== "ALL" ? `?status=${status}` : "";
    const res = await apiFetch<unknown>(`/admin/stores${query}`);
    const items = extractItems<any>(res);
    return items.map((s: any) => ({
      id: s.id,
      name: s.storeName || s.name || `Gian hàng #${s.id}`,
      legalName: s.legalName || s.storeName || "",
      ownerName: s.ownerFullName || s.ownerName || "Chủ gian hàng",
      ownerEmail: s.ownerEmail || "",
      phone: s.phone || s.ownerPhone || "0900000000",
      status: (s.status as "PENDING" | "APPROVED" | "BANNED" | "REJECTED") || "APPROVED",
      productsCount: Number(s.productsCount || s.totalProducts || 0),
      ordersCount: Number(s.ordersCount || s.totalOrders || 0),
      ratingAvg: Number(s.ratingAvg || 5.0),
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      avatarUrl: s.avatarUrl || s.logoUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=120&auto=format&fit=crop&q=80",
      businessAddress: s.description || "Việt Nam",
    }));
  } catch (err) {
    console.error("[getAdminStores] Backend API call failed:", err);
    throw err;
  }
}

export async function updateAdminStoreStatus(
  id: number,
  status: "APPROVED" | "BANNED" | "SUSPENDED" | "REJECTED",
  reason?: string
): Promise<void> {
  await apiFetch<void>(`/admin/stores/${id}/status`, {
    method: "PATCH",
    json: { status, reason },
  });
}

// ============================================================================
// 32. Quản lý Người dùng (Stitch Screen 31)
// ============================================================================

export type AdminUser = import("@/types/admin").AdminUser;

export interface GetAdminUsersParams {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export async function getAdminUsers(
  params?: GetAdminUsersParams
): Promise<import("@/types/api").PageResponse<AdminUser>> {
  const queryParams: Record<string, string | number> = {};
  if (params?.role && params.role !== "ALL") {
    queryParams.role = params.role;
  }
  if (params?.status && params.status !== "ALL") {
    queryParams.status = params.status;
  }
  if (params?.search?.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params?.page !== undefined) {
    queryParams.page = params.page;
  }
  if (params?.size !== undefined) {
    queryParams.size = params.size;
  }

  try {
    const res = await apiFetch<import("@/types/api").PageResponse<AdminUser>>("/admin/users", {
      query: queryParams,
    });
    return {
      ...res,
      content: res.content ?? res.items ?? [],
    };
  } catch (err) {
    console.warn("[getAdminUsers] Backend API call failed, falling back to mock users:", err);
    const mockItems = getMockAdminUsers(params);
    return {
      content: mockItems,
      items: mockItems,
      pageNumber: params?.page ?? 0,
      pageSize: params?.size ?? mockItems.length,
      totalElements: mockItems.length,
      totalPages: 1,
      isFirst: true,
      isLast: true,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

export async function updateAdminUserStatus(
  id: number,
  status: "ACTIVE" | "LOCKED",
  reason?: string
): Promise<void> {
  try {
    await apiFetch<void>(`/admin/users/${id}/status`, {
      method: "PATCH",
      json: { status, reason },
    });
  } catch (err) {
    console.warn("[updateAdminUserStatus] Backend API call failed, running in fallback mode:", err);
  }
}

// ============================================================================
// 33. Quản lý Sản phẩm toàn sàn (Stitch Screen 33)
// ============================================================================

export type AdminProduct = MockProductItem;

export async function getAdminProducts(params?: {
  categoryId?: number;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}): Promise<AdminProduct[]> {
  if (isMockMode()) {
    return getMockAdminProducts(params);
  }

  try {
    const query: Record<string, string | number> = {};
    if (params?.status && params.status !== "ALL") query.status = params.status;
    if (params?.categoryId) query.categoryId = params.categoryId;
    if (params?.search?.trim()) query.search = params.search.trim();
    query.page = params?.page ?? 0;
    query.size = params?.size ?? 100;

    const res = await apiFetch<unknown>("/admin/products", { query });
    const items = extractItems<any>(res);
    if (items.length === 0 && !params?.status && !params?.categoryId && !params?.search) {
      return getMockAdminProducts(params);
    }
    return items.map((p: any) => ({
      id: p.id,
      name: p.name ?? `Sản phẩm #${p.id}`,
      slug: p.slug ?? `san-pham-${p.id}`,
      storeName: p.storeName ?? "Cửa hàng",
      categoryName: p.categoryName ?? "Ngành hàng",
      minPrice: Number(p.minPrice ?? 0),
      maxPrice: Number(p.maxPrice ?? p.minPrice ?? 0),
      totalStock: Number(p.totalStock ?? 0),
      status: (p.status as "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "BANNED") || "ACTIVE",
      primaryImageUrl: p.primaryImageUrl || p.imageUrl || "/images/placeholder.png",
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn("[getAdminProducts] Backend API call failed, falling back to mock products:", err);
    return getMockAdminProducts(params);
  }
}

export async function updateAdminProductStatus(
  id: number,
  status: "ACTIVE" | "INACTIVE" | "BANNED",
  reason?: string
): Promise<void> {
  if (isMockMode()) {
    updateMockAdminProductStatus(id, status);
    return;
  }

  try {
    await apiFetch<void>(`/admin/products/${id}/status`, {
      method: "PATCH",
      json: { status, reason },
    });
  } catch (err) {
    updateMockAdminProductStatus(id, status);
    console.warn("[updateAdminProductStatus] Backend call failed, updated mock fallback:", err);
    throw err;
  }
}

// ============================================================================
// 34. Quản lý Lệnh Rút tiền Ví Người Bán (Admin Wallets / Withdrawals)
// ============================================================================

export async function getAdminWithdrawals(params?: {
  status?: string;
  storeId?: number;
  page?: number;
  size?: number;
}): Promise<PageResponse<AdminWithdrawalResponse>> {
  const mockList: AdminWithdrawalResponse[] = [
    {
      id: 1,
      requestCode: "WDR-261018-9921",
      walletId: 1,
      storeId: 1,
      storeName: "UTC Fashion",
      amount: 500000,
      status: "PENDING",
      bankName: "Ngân hàng Ngoại thương Việt Nam (Vietcombank)",
      bankCode: "VCB",
      accountNumber: "102988391204",
      accountHolder: "NGUYEN VAN AN",
      branch: "Chi nhánh Thủ Đức",
      sellerNote: "Rút tiền doanh thu đợt 1",
      createdAt: new Date().toISOString(),
    },
  ];

  try {
    const query: Record<string, string | number> = {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    };
    if (params?.status && params.status !== "ALL") {
      query.status = params.status;
    }
    if (params?.storeId) {
      query.storeId = params.storeId;
    }
    const res = await apiFetch<PageResponse<AdminWithdrawalResponse>>("/admin/wallets/withdrawals", {
      query,
    });
    const items = extractItems<AdminWithdrawalResponse>(res);
    return {
      ...res,
      content: items,
      items: items,
      totalElements: res?.totalElements ?? items.length,
      pageNumber: res?.pageNumber ?? params?.page ?? 0,
      pageSize: res?.pageSize ?? params?.size ?? 10,
      totalPages: res?.totalPages ?? 1,
      isFirst: res?.isFirst ?? true,
      isLast: res?.isLast ?? true,
      hasNext: res?.hasNext ?? false,
      hasPrevious: res?.hasPrevious ?? false,
    };
  } catch (err) {
    console.warn("[getAdminWithdrawals] Backend API call failed, falling back to mock withdrawals:", err);
    return {
      content: mockList,
      items: mockList,
      pageNumber: params?.page ?? 0,
      pageSize: params?.size ?? 10,
      totalElements: mockList.length,
      totalPages: 1,
      isFirst: true,
      isLast: true,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

export async function approveWithdrawal(
  id: number,
  payload?: ApproveWithdrawalPayload
): Promise<AdminWithdrawalResponse> {
  return await apiFetch<AdminWithdrawalResponse>(`/admin/wallets/withdrawals/${id}/approve`, {
    method: "PATCH",
    json: payload || {},
  });
}

export async function rejectWithdrawal(
  id: number,
  payload: RejectWithdrawalPayload
): Promise<AdminWithdrawalResponse> {
  return await apiFetch<AdminWithdrawalResponse>(`/admin/wallets/withdrawals/${id}/reject`, {
    method: "PATCH",
    json: payload,
  });
}

// ============================================================================
// 34. Báo cáo & Thống kê Tổng quan Dashboard
// ============================================================================

export interface AdminDashboardChartPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface AdminDashboardTopStore {
  id: number;
  name: string;
  legalName: string;
  revenue: number;
  orders: number;
  avatarUrl: string;
}

export interface AdminDashboardCategoryShare {
  categoryId: number;
  name: string;
  revenue: number;
  sharePercentage: number;
}

export interface AdminDashboardPendingTasks {
  pendingStores: number;
  pendingFlashSaleItems: number;
  pendingWithdrawals: number;
  reportedReviews: number;
}

export interface AdminDashboardSummary {
  periodType: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  revenueGrowthPercent: number;
  totalOrders: number;
  ordersGrowthPercent: number;
  newUsers: number;
  usersGrowthPercent: number;
  newStores: number;
  storesGrowthPercent: number;
  chartPoints: AdminDashboardChartPoint[];
  topStores: AdminDashboardTopStore[];
  categoryShares: AdminDashboardCategoryShare[];
  pendingTasks: AdminDashboardPendingTasks;
}

export interface GetAdminDashboardParams {
  periodType?: "DAY" | "MONTH" | "YEAR" | "CUSTOM";
  year?: number;
  month?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAdminDashboardSummary(
  params?: GetAdminDashboardParams
): Promise<AdminDashboardSummary> {
  const queryParts: string[] = [];
  if (params?.periodType) queryParts.push(`periodType=${params.periodType}`);
  if (params?.year) queryParts.push(`year=${params.year}`);
  if (params?.month) queryParts.push(`month=${params.month}`);
  if (params?.date) queryParts.push(`date=${params.date}`);
  if (params?.startDate) queryParts.push(`startDate=${params.startDate}`);
  if (params?.endDate) queryParts.push(`endDate=${params.endDate}`);
  const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  try {
    const res = await apiFetch<any>(`/admin/dashboard/summary${qs}`);
    const data = res?.data || res;
    return {
      periodType: data.periodType || params?.periodType || "MONTH",
      periodLabel: data.periodLabel || "Kỳ báo cáo",
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date().toISOString(),
      totalRevenue: Number(data.totalRevenue || 0),
      revenueGrowthPercent: Number(data.revenueGrowthPercent || 0),
      totalOrders: Number(data.totalOrders || 0),
      ordersGrowthPercent: Number(data.ordersGrowthPercent || 0),
      newUsers: Number(data.newUsers || 0),
      usersGrowthPercent: Number(data.usersGrowthPercent || 0),
      newStores: Number(data.newStores || 0),
      storesGrowthPercent: Number(data.storesGrowthPercent || 0),
      chartPoints: Array.isArray(data.chartPoints) ? data.chartPoints : [],
      topStores: Array.isArray(data.topStores) ? data.topStores : [],
      categoryShares: Array.isArray(data.categoryShares) ? data.categoryShares : [],
      pendingTasks: data.pendingTasks || {
        pendingStores: 0,
        pendingFlashSaleItems: 0,
        pendingWithdrawals: 0,
        reportedReviews: 0,
      },
    };
  } catch (err) {
    console.warn("[getAdminDashboardSummary] Backend call failed, using fallback:", err);
    throw err;
  }
}




