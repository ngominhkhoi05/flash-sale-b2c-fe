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

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  /** Query params (sẽ stringify an toàn). */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** JSON body – sẽ được JSON.stringify. */
  json?: unknown;
  /** Bỏ qua refresh khi 401 (mặc định: cho phép). */
  withAuth?: boolean;
  /** Tự retry khi 5xx (mặc định: 0). */
  retries?: number;
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
 * - Tự set Content-Type cho JSON.
 * - Chuẩn hoá response về ApiResponse<T> hoặc ném ApiError.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { query, json, headers, retries = 0, withAuth = true, ...init } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
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
    message: "Mất kết nối mạng",
  });
}
