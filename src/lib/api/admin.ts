import { apiFetch, isMockMode } from "./client";
import type {
  AdminFlashSaleSession,
  CreateFlashSaleSessionInput,
  FlashSaleSlotStatus,
} from "@/types/flash-sale";
import type {
  SkuApprovalItem,
  SkuApprovalCounts,
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

/** BE Response DTO */
interface FlashSaleSlotResponse {
  id: number;
  title: string;
  startTime: string; // ISO Instant
  endTime: string;   // ISO Instant
  reservationTtlSeconds: number;
  status: string;
  createdAt?: string;
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
    approvedSkusCount: 0,
    pendingSkusCount: 0,
    totalSkusCount: 0,
    soldQuantity: 0,
    allocatedQuantity: 0,
    status: (slot.status as FlashSaleSlotStatus) || "UPCOMING",
    createdAt: slot.createdAt,
  };
}

/**
 * 1. Lấy danh sách toàn bộ phiên Flash Sale (KHỚP BE: GET /api/v1/admin/flash-sales/slots)
 */
export async function getAdminFlashSaleSlots(): Promise<AdminFlashSaleSession[]> {
  try {
    const slots = await apiFetch<FlashSaleSlotResponse[]>("/admin/flash-sales/slots");
    if (!slots || slots.length === 0) {
      if (isMockMode()) {
        return getMockFlashSaleSessions();
      }
      return [];
    }
    return slots.map(mapSlotToSession);
  } catch (err) {
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
 * 5. Duyệt một SKU Flash Sale (KHỚP BE: PATCH /api/v1/admin/flash-sales/items/{id}/approve)
 */
export async function approveFlashSaleSku(id: number): Promise<void> {
  try {
    await apiFetch<unknown>(`/admin/flash-sales/items/${id}/approve`, {
      method: "PATCH",
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

/**
 * 7. Lấy danh sách duyệt SKU cho phiên Flash Sale
 */
export async function getAdminSkuApprovals(slotId?: number): Promise<SkuApprovalItem[]> {
  try {
    return await apiFetch<SkuApprovalItem[]>("/admin/flash-sales/items", {
      query: slotId ? { slotId } : undefined,
    });
  } catch (err) {
    if (isMockMode()) {
      return getMockSkuApprovals(slotId);
    }
    throw err;
  }
}

/**
 * 8. Lấy số lượng thống kê phê duyệt SKU
 */
export async function getAdminApprovalCounts(slotId?: number): Promise<SkuApprovalCounts> {
  try {
    return await apiFetch<SkuApprovalCounts>("/admin/flash-sales/items/counts", {
      query: slotId ? { slotId } : undefined,
    });
  } catch (err) {
    if (isMockMode()) {
      return getApprovalCounts(slotId);
    }
    throw err;
  }
}

/**
 * 9. Batch duyệt SKU
 */
export async function batchApproveFlashSaleSkus(ids: number[]): Promise<void> {
  try {
    await apiFetch<void>("/admin/flash-sales/items/batch-approve", {
      method: "POST",
      json: { ids },
    });
  } catch (err) {
    if (isMockMode()) {
      batchApproveSkus(ids);
      return;
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

/**
 * 12. Lấy dữ liệu Realtime Telemetry cho phiên Flash Sale
 */
export async function getAdminRealtimeTelemetry(slotId: number): Promise<RealtimeTelemetry> {
  try {
    return await apiFetch<RealtimeTelemetry>(`/admin/flash-sales/slots/${slotId}/telemetry`);
  } catch (err) {
    if (isMockMode()) {
      return getMockTelemetry();
    }
    throw err;
  }
}

/**
 * 13. Lấy danh sách Live SKUs cho monitor
 */
export async function getAdminLiveSkus(slotId: number): Promise<LiveSkuInventoryItem[]> {
  try {
    return await apiFetch<LiveSkuInventoryItem[]>(`/admin/flash-sales/slots/${slotId}/skus`);
  } catch (err) {
    if (isMockMode()) {
      return getMockLiveSkus();
    }
    throw err;
  }
}

/**
 * 14. Lấy danh sách sự kiện Live Logs cho monitor
 */
export async function getAdminLiveLogs(slotId: number): Promise<LiveLogEvent[]> {
  try {
    return await apiFetch<LiveLogEvent[]>(`/admin/flash-sales/slots/${slotId}/logs`);
  } catch (err) {
    if (isMockMode()) {
      return getMockLiveLogs();
    }
    throw err;
  }
}

/**
 * 15. Tạm dừng / Tiếp tục phiên khẩn cấp (Emergency Pause)
 */
export async function toggleAdminEmergencyPause(
  slotId: number,
  reason: string
): Promise<boolean> {
  try {
    const res = await apiFetch<{ isPaused: boolean }>(
      `/admin/flash-sales/slots/${slotId}/emergency-pause`,
      {
        method: "POST",
        json: { reason },
      }
    );
    return res.isPaused;
  } catch (err) {
    if (isMockMode()) {
      return toggleSessionPause(true).isPaused;
    }
    throw err;
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
  return {
    id: String(v.id),
    code: v.code,
    name: isPercent
      ? `Giảm ${v.discountValue}% toàn sàn`
      : `Giảm ${Number(v.discountValue).toLocaleString()}đ toàn sàn`,
    discountType: isPercent ? "PERCENT" : "FIXED",
    discountValue: Number(v.discountValue),
    maxDiscountAmount: v.maxDiscountAmount ? Number(v.maxDiscountAmount) : undefined,
    minOrderAmount: Number(v.minOrderAmount || 0),
    usedCount: v.usedQuantity || 0,
    totalCount: v.totalQuantity,
    limitPerCustomer: v.userUsageLimit || 1,
    startDate: v.startTime,
    endDate: v.endTime,
    status: (v.status as VoucherStatus) || "ACTIVE",
    isActive: v.status === "ACTIVE",
    scope: "ALL",
    isPublic: true,
    createdAt: v.createdAt || v.startTime,
  };
}

/**
 * 16. Lấy danh sách mã giảm giá toàn sàn (KHỚP BE: GET /api/v1/vouchers/platform)
 */
export async function getAdminPlatformVouchers(
  params?: VoucherFilterParams & { page?: number; pageSize?: number }
): Promise<ReturnType<typeof voucherMockService.getAll>> {
  try {
    const list = await apiFetch<BeVoucherResponse[]>("/vouchers/platform");
    if (!list || list.length === 0) {
      if (isMockMode()) {
        return voucherMockService.getAll(params);
      }
      return {
        items: [],
        total: 0,
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        counts: { ALL: 0, ACTIVE: 0, UPCOMING: 0, OUT_OF_STOCK: 0, EXPIRED: 0, DISABLED: 0 },
      };
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
    const page = params?.page ?? 0;
    const pageSize = params?.pageSize ?? 10;
    const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

    const counts = {
      ALL: allMapped.length,
      ACTIVE: allMapped.filter((v) => v.status === "ACTIVE").length,
      UPCOMING: allMapped.filter((v) => v.status === "UPCOMING").length,
      OUT_OF_STOCK: allMapped.filter((v) => v.status === "OUT_OF_STOCK").length,
      EXPIRED: allMapped.filter((v) => v.status === "EXPIRED").length,
      DISABLED: allMapped.filter((v) => v.status === "DISABLED").length,
    };

    return {
      items: paginated,
      total: filtered.length,
      page,
      pageSize,
      counts,
    };
  } catch (err) {
    if (isMockMode()) {
      return voucherMockService.getAll(params);
    }
    throw err;
  }
}

/**
 * 17. Tạo mã giảm giá sàn mới (KHỚP BE: POST /api/v1/admin/vouchers)
 */
export async function createAdminPlatformVoucher(
  data: Omit<AdminVoucher, "id" | "usedCount" | "status" | "isActive" | "createdAt">
): Promise<AdminVoucher> {
  try {
    const payload = {
      code: data.code.toUpperCase(),
      storeId: null,
      discountType: data.discountType === "PERCENT" ? "PERCENT" : "FIXED_AMOUNT",
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      maxDiscountAmount: data.maxDiscountAmount || data.discountValue,
      totalQuantity: data.totalCount,
      userUsageLimit: data.limitPerCustomer,
      startTime: data.startDate,
      endTime: data.endDate,
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
    return await apiFetch<VoucherKpis>("/admin/vouchers/kpis");
  } catch {
    return voucherMockService.getKpis();
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
    if (isMockMode()) {
      return reconciliationMockService.getKpis();
    }
    throw err;
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
    if (isMockMode()) {
      return reconciliationMockService.getOrders(params);
    }
    throw err;
  }
}

/**
 * 21. Lấy danh sách hoàn tiền đối soát (BE THIẾU: docs/api-requests/admin-reconciliation.md)
 */
export async function getAdminReconciliationRefunds(
  params?: { search?: string; period?: string }
): Promise<ReconciliationRefund[]> {
  try {
    return await apiFetch<ReconciliationRefund[]>("/admin/reconciliation/refunds", {
      query: params,
    });
  } catch (err) {
    if (isMockMode()) {
      return reconciliationMockService.getRefunds(params);
    }
    throw err;
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
    if (isMockMode()) {
      return;
    }
    throw err;
  }
}

/**
 * 23. Lấy danh sách vai trò hệ thống (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminSystemRoles(): Promise<SystemRole[]> {
  try {
    return await apiFetch<SystemRole[]>("/admin/roles");
  } catch (err) {
    if (isMockMode()) {
      return permissionsMockService.getSystemRoles();
    }
    throw err;
  }
}

/**
 * 24. Lấy danh sách nhóm quyền nội bộ (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminRoleGroups(): Promise<InternalRoleGroup[]> {
  try {
    return await apiFetch<InternalRoleGroup[]>("/admin/role-groups");
  } catch (err) {
    if (isMockMode()) {
      return permissionsMockService.getRoleGroups();
    }
    throw err;
  }
}

/**
 * 25. Lấy danh sách ACL permissions (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminAclPermissions(): Promise<AclPermission[]> {
  try {
    return await apiFetch<AclPermission[]>("/admin/permissions");
  } catch (err) {
    if (isMockMode()) {
      return permissionsMockService.getAclPermissions();
    }
    throw err;
  }
}

/**
 * 26. Lấy danh sách cờ tính năng (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    return await apiFetch<FeatureFlag[]>("/admin/feature-flags");
  } catch (err) {
    if (isMockMode()) {
      return permissionsMockService.getFeatureFlags();
    }
    throw err;
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
    if (isMockMode()) {
      return permissionsMockService.toggleFeatureFlag(code, isEnabled, maintenanceReason);
    }
    throw err;
  }
}

/**
 * 28. Lấy danh sách đánh giá bị báo cáo (BE THIẾU: docs/api-requests/admin-permissions.md)
 */
export async function getAdminReportedReviews(): Promise<ReportedReview[]> {
  try {
    return await apiFetch<ReportedReview[]>("/admin/reviews/moderation");
  } catch (err) {
    if (isMockMode()) {
      return permissionsMockService.getReportedReviews();
    }
    throw err;
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
    if (isMockMode()) {
      return permissionsMockService.moderateReview(reviewId, action);
    }
    throw err;
  }
}


