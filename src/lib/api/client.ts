import { COOKIE_KEYS, STORAGE_KEYS } from "@/lib/constants";

/**
 * Lớp lỗi chuẩn hoá cho mọi API call.
 * Tránh ném Error thuần – mang theo status, code, message có cấu trúc
 * để component dễ rẽ nhánh (rule §7).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

/** Đọc JWT từ localStorage (client-only). */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/** Ghi JWT vào cả localStorage và cookie (để SSR/middleware đọc được). */
export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  // Cookie không HttpOnly: chỉ dùng cho Next.js middleware đọc phân quyền.
  // Server KHÔNG tin cookie này để xác thực – backend vẫn kiểm tra Bearer.
  document.cookie = `${COOKIE_KEYS.ACCESS_TOKEN}=${encodeURIComponent(
    token
  )}; Path=/; SameSite=Lax; Max-Age=86400`;
}

/** Xoá token khỏi cả localStorage lẫn cookie. */
export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  document.cookie = `${COOKIE_KEYS.ACCESS_TOKEN}=; Path=/; Max-Age=0`;
}

/** Refresh token – lưu sessionStorage (đóng khi tab đóng, an toàn hơn localStorage). */
const REFRESH_TOKEN_KEY = "fs_refresh_token";

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearRefreshToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

import {
  getMockServerTime,
  getMockSlots,
  mockFlashSaleItems,
  mockUpcomingItems,
  handleMockBuyNow,
  getMockAdminDashboard,
  mockAdminCampaigns,
  getMockRealtimeMonitoringData,
} from "@/lib/mocks";
import type {
  FlashSaleSlot,
  FlashSaleItem,
  BuyNowRequest,
  BuyNowResponse,
} from "@/types/flash-sale";
import type {
  AdminDashboardData,
  AdminCampaign,
  AdminCampaignFormData,
  AdminRealtimeMonitorData,
} from "@/types/admin";
import type { ServerTimeResponse } from "@/types/api";

/** Lấy User ID tạm thời cho header X-User-Id theo quy ước đồ án (an toàn với SSR) */
export function getCurrentUserId(): string {
  if (typeof window === "undefined") {
    return "1001";
  }
  try {
    const saved = window.localStorage.getItem("fs_mock_user_id");
    return saved || "1001";
  } catch {
    // Bỏ qua lỗi truy cập localStorage (chế độ ẩn danh, restricted iframe hoặc cookie disabled)
    return "1001";
  }
}

/** Đặt User ID tạm thời để kiểm thử (chỉ chạy phía client) */
export function setMockUserId(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("fs_mock_user_id", userId);
  } catch {
    // Bỏ qua lỗi ghi localStorage phía client
  }
}

/** Kiểm tra chế độ Mock data (chỉ bật khi NEXT_PUBLIC_USE_MOCKS === "true") */
export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
}

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  /** Query params (sẽ stringify an toàn). */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** JSON body – sẽ được JSON.stringify. */
  json?: unknown;
  /** Bỏ qua refresh khi 401 (mặc định: cho phép). */
  withAuth?: boolean;
  /** Tự retry khi 5xx (mặc định: 0). */
  retries?: number;
  /** Bỏ qua mock data ngay cả khi mock mode đang bật */
  skipMock?: boolean;
};

interface BackendEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
  code?: string;
  error?: { code?: string; message?: string; details?: unknown };
  // Một số backend trả thẳng object
  [k: string]: unknown;
}

/** Lấy base URL – chấp nhận cả absolute (http://...) và relative (/api/v1).
 *
 * - Absolute (vd `http://localhost:8080`, `https://api.example.com`):
 *   dev mode hoặc khi FE cùng origin với backend, gọi thẳng tới backend.
 * - Relative (vd `/api/v1`, `""`):
 *   production với Nginx reverse proxy: buildUrl() tự ghép với
 *   `window.location.origin` để tạo absolute URL.
 *   Khi không có `window` (SSR/Node), trả về `""` và để buildUrl()
 *   ném lỗi có thông báo rõ ràng.
 */
function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  return raw.replace(/\/$/, "");
}

/** True nếu chuỗi là absolute URL (có scheme http:// hoặc https://). */
function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function buildUrl(path: string, query?: ApiFetchOptions["query"]): string {
  const base = getBaseUrl();
  // Backend Spring Boot uses /api/v1 prefix for all endpoints
  // (rule flash-sale-b2c-api). Prepend it unless caller already included.
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const withVersion = cleanPath.startsWith("/api/") || cleanPath.startsWith("/api/v")
    ? cleanPath
    : `/api/v1${cleanPath}`;

  // Nếu base rỗng hoặc relative (vd "/api/v1", ""), ghép với
  // window.location.origin để tạo absolute URL. Yêu cầu môi trường
  // client (window có sẵn). Nếu gọi từ server, ném lỗi rõ ràng.
  let fullBase: string;
  if (!base || !isAbsoluteUrl(base)) {
    if (typeof window === "undefined") {
      throw new Error(
        "buildUrl: NEXT_PUBLIC_API_URL is relative but called from a " +
          "server context. Use an absolute URL (e.g. https://api.example.com) " +
          "for SSR, or call apiFetch from a Client Component."
      );
    }
    fullBase = window.location.origin;
  } else {
    fullBase = base;
  }

  const url = new URL(`${fullBase}${withVersion}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * apiFetch – client chính cho mọi request (rule §7, rule api-data).
 * - Gắn Authorization từ localStorage (fs_access_token).
 * - Gắn X-User-Id theo quy ước đồ án.
 * - Tự set Content-Type cho JSON.
 * - Hỗ trợ mock data tự động trong dev mode khi BE chưa sẵn sàng.
 * - Chuẩn hoá response về data hoặc ném ApiError.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { query, json, headers, retries = 0, withAuth = true, skipMock = false, ...init } = options;

  // Nếu bật mock mode và không bị ép skip, kiểm tra mock data
  if (isMockMode() && !skipMock) {
    const mockData = dispatchMock<T>(path, init.method || "GET", json, query as Record<string, unknown>);
    if (mockData !== null) {
      await delay(120); // Giả lập độ trễ mạng nhẹ
      return mockData;
    }
  }

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    "X-User-Id": getCurrentUserId(), // Quy ước theo yêu cầu
    ...(headers as Record<string, string> | undefined),
  };

  if (withAuth) {
    const token = getAccessToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const url = buildUrl(path, query);
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, { ...init, headers: finalHeaders, body });
      // Không có body (204)
      if (res.status === 204) return undefined as T;

      const text = await res.text();
      let payload: BackendEnvelope<T> | null = null;
      if (text) {
        try {
          payload = JSON.parse(text) as BackendEnvelope<T>;
        } catch {
          // Không phải JSON – coi như text thuần
          payload = { message: text } as BackendEnvelope<T>;
        }
      }

      if (!res.ok) {
        const errCode =
          payload?.code ?? payload?.error?.code ?? `HTTP_${res.status}`;
        const errMsg =
          payload?.message ?? payload?.error?.message ?? res.statusText;
        throw new ApiError({
          status: res.status,
          code: errCode,
          message: errMsg,
          details: payload?.error?.details ?? payload,
        });
      }

      // Một số backend bọc { data }, một số trả thẳng T.
      if (
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        payload.data !== undefined
      ) {
        return payload.data as T;
      }
      return payload as T;
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && err.status < 500) throw err; // 4xx không retry
      attempt += 1;
      if (attempt > retries) break;
      await delay(500 * attempt);
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message: "Mất kết nối mạng hoặc máy chủ không phản hồi",
  });
}

/**
 * Dispatcher dữ liệu Mock cho các endpoint trọng tâm
 */
function dispatchMock<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  params?: Record<string, unknown>
): T | null {
  const path = endpoint.split("?")[0].replace(/^\/api\/v1/, "").replace(/^\/api/, "");

  // 1. Endpoint lấy giờ server
  if (path === "/time" || endpoint.includes("/time")) {
    return getMockServerTime() as unknown as T;
  }

  // 2. Danh sách khung giờ Flash Sale
  if (path === "/flash-sale/slots") {
    return getMockSlots() as unknown as T;
  }

  // 3. Khung giờ Flash Sale đang ACTIVE
  if (path === "/flash-sale/slots/active") {
    const slots = getMockSlots();
    const active = slots.find((s) => s.status === "ACTIVE") || slots[1];
    return active as unknown as T;
  }

  // 4. Danh sách sản phẩm Flash Sale theo slot
  if (path.startsWith("/flash-sale/items") || endpoint.includes("/flash-sale/items")) {
    const slotId = Number(params?.slotId) || 102;
    const items = slotId === 103 ? mockUpcomingItems : mockFlashSaleItems;
    return items as unknown as T;
  }

  // 5. Mua ngay Flash Sale
  if (path === "/flash-sale/orders" && method === "POST") {
    const result = handleMockBuyNow(body as BuyNowRequest);
    return result as unknown as T;
  }

  // 6. Admin KPI Dashboard
  if (path === "/admin/dashboard/kpi" || path === "/admin/dashboard") {
    return getMockAdminDashboard() as unknown as T;
  }

  // 7. Admin Campaigns (Khung giờ)
  if (path === "/admin/flash-sale/campaigns") {
    if (method === "POST") {
      const form = body as AdminCampaignFormData;
      const newCampaign: AdminCampaign = {
        id: Date.now(),
        name: form.name,
        slotName: "Chiến dịch mới tạo",
        startTime: form.startTime,
        endTime: form.endTime,
        status: "UPCOMING",
        productCount: 1,
        totalAllocatedStock: form.allocatedStock,
        totalSoldStock: 0,
        revenue: 0,
      };
      mockAdminCampaigns.push(newCampaign);
      return newCampaign as unknown as T;
    }
    return mockAdminCampaigns as unknown as T;
  }

  // 8. Admin Giám sát realtime
  if (path === "/admin/flash-sale/monitoring") {
    return getMockRealtimeMonitoringData() as unknown as T;
  }

  return null;
}

// === Export các hàm gọi API tiện lợi ===
export const api = {
  get: <T>(url: string, opts?: ApiFetchOptions) => apiFetch<T>(url, { ...opts, method: "GET" }),
  post: <T>(url: string, json?: unknown, opts?: ApiFetchOptions) =>
    apiFetch<T>(url, { ...opts, method: "POST", json }),
  put: <T>(url: string, json?: unknown, opts?: ApiFetchOptions) =>
    apiFetch<T>(url, { ...opts, method: "PUT", json }),
  delete: <T>(url: string, opts?: ApiFetchOptions) =>
    apiFetch<T>(url, { ...opts, method: "DELETE" }),

  // Domain API functions
  getServerTime: () => api.get<ServerTimeResponse>("/api/time"),
  getFlashSaleSlots: () => api.get<FlashSaleSlot[]>("/api/v1/flash-sale/slots"),
  getActiveSlot: () => api.get<FlashSaleSlot>("/api/v1/flash-sale/slots/active"),
  getFlashSaleItems: (slotId: number) =>
    api.get<FlashSaleItem[]>("/api/v1/flash-sale/items", { query: { slotId } }),
  buyNow: (data: BuyNowRequest) => api.post<BuyNowResponse>("/api/v1/flash-sale/orders", data),

  // Admin API functions
  getAdminDashboard: () => api.get<AdminDashboardData>("/api/v1/admin/dashboard/kpi"),
  getAdminCampaigns: () => api.get<AdminCampaign[]>("/api/v1/admin/flash-sale/campaigns"),
  createAdminCampaign: (data: AdminCampaignFormData) =>
    api.post<AdminCampaign>("/api/v1/admin/flash-sale/campaigns", data),
  getAdminRealtimeMonitor: (slotId?: number) =>
    api.get<AdminRealtimeMonitorData>("/api/v1/admin/flash-sale/monitoring", {
      query: { slotId },
    }),
};
