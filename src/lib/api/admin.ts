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
