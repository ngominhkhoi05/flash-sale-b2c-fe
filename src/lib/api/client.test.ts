/**
 * Test cho buildUrl() – đặc biệt là xử lý base URL tương đối (relative).
 *
 * Bug gốc: khi NEXT_PUBLIC_API_URL = "/api/v1" (relative) thì
 *   new URL("/api/v1" + "/api/v1/auth/login")
 *   → throw "Invalid URL" vì relative + relative không tạo absolute URL.
 *
 * Fix: buildUrl() phải dùng window.location.origin làm fallback khi
 * base là relative. Chỉ chạy client-side (window có sẵn).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env.NEXT_PUBLIC_API_URL;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL_ENV === undefined) {
    delete process.env.NEXT_PUBLIC_API_URL;
  } else {
    process.env.NEXT_PUBLIC_API_URL = ORIGINAL_ENV;
  }
});

async function loadApi() {
  return await import("./client");
}

describe("buildUrl – base URL handling", () => {
  it("absolute base (dev) – ghép đúng path + version prefix", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: null }), { status: 200 })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const mod = await loadApi();
    await mod.apiFetch("/auth/login");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchMock.mock.calls[0]?.[0] as string) ?? "";
    expect(calledUrl).toBe("http://localhost:8080/api/v1/auth/login");
  });

  it("relative base (/api/v1) – dùng window.location.origin", async () => {
    process.env.NEXT_PUBLIC_API_URL = "/api/v1";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: null }), { status: 200 })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const mod = await loadApi();
    await mod.apiFetch("/auth/login");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchMock.mock.calls[0]?.[0] as string) ?? "";
    expect(calledUrl).toBe("http://localhost:3000/api/v1/auth/login");
  });

  it("empty base – dùng window.location.origin", async () => {
    process.env.NEXT_PUBLIC_API_URL = "";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: null }), { status: 200 })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const mod = await loadApi();
    await mod.apiFetch("/auth/login");

    const calledUrl = (fetchMock.mock.calls[0]?.[0] as string) ?? "";
    expect(calledUrl).toBe("http://localhost:3000/api/v1/auth/login");
  });

  it("absolute base – path đã có /api/v1 thì KHÔNG double-prefix", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: null }), { status: 200 })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const mod = await loadApi();
    await mod.apiFetch("/api/v1/auth/login");

    const calledUrl = (fetchMock.mock.calls[0]?.[0] as string) ?? "";
    expect(calledUrl).toBe("http://localhost:8080/api/v1/auth/login");
  });

  it("base có sẵn /api/v1 – KHÔNG bị double /api/v1/api/v1", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080/api/v1";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: null }), { status: 200 })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const mod = await loadApi();
    await mod.apiFetch("/api/v1/auth/login");

    const calledUrl = (fetchMock.mock.calls[0]?.[0] as string) ?? "";
    expect(calledUrl).toBe("http://localhost:8080/api/v1/auth/login");
  });

  it("relative base + query params – giữ query string đúng", async () => {
    process.env.NEXT_PUBLIC_API_URL = "/api/v1";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: null }), { status: 200 })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const mod = await loadApi();
    await mod.apiFetch("/products", { query: { page: 2, size: 10 } });

    const calledUrl = (fetchMock.mock.calls[0]?.[0] as string) ?? "";
    expect(calledUrl).toContain("/api/v1/products?");
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("size=10");
  });
});

// Bug gốc 2026-10-18: khi fetch() throw (network fail, CORS, abort), apiFetch
// re-throw plain Error thay vì ApiError. Hệ quả:
//   1. ProductDetailPage.onError `instanceof ApiError` false → rơi vào fallback
//      toast "Không thể cập nhật giỏ hàng" — user không biết chuyện gì.
//   2. console.error({ error }) in ra '[object Error]' do Error.prototype.toString
//      mặc định → mất luôn message gốc của fetch error.
//   3. Vi phạm error-handling.mdc mục 2: "apiFetch throw ApiError khi response
//      không OK" — bao gồm cả case không có response (network fail).
describe("apiFetch – network error wrapping (2026-10-18)", () => {
  it("fetch() throw TypeError (network fail) → reject với ApiError code='NETWORK_ERROR', status=0, message chứa nguyên nhân gốc", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080";
    const fetchMock = vi.fn().mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const mod = await loadApi();

    let caught: unknown;
    try {
      await mod.apiFetch("/api/v1/cart/items", {
        method: "POST",
        json: { variantId: 14, quantity: 1 },
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(mod.ApiError);
    const apiErr = caught as InstanceType<typeof mod.ApiError>;
    expect(apiErr.code).toBe("NETWORK_ERROR");
    expect(apiErr.status).toBe(0);
    // Message phải chứa lý do gốc để user debug được.
    expect(apiErr.message).toContain("Failed to fetch");
    // details giữ thông tin gốc cho logger/console.
    expect(apiErr.details).toMatchObject({
      originalName: "TypeError",
      originalMessage: "Failed to fetch",
    });
  });

  it("fetch() throw DOMException AbortError (component unmount) → reject với ApiError code='REQUEST_ABORTED'", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080";
    const abortErr =
      typeof DOMException !== "undefined"
        ? new DOMException("Aborted", "AbortError")
        : Object.assign(new Error("Aborted"), { name: "AbortError" });
    const fetchMock = vi.fn().mockRejectedValue(abortErr);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const mod = await loadApi();

    let caught: unknown;
    try {
      await mod.apiFetch("/api/v1/cart/items", {
        method: "POST",
        json: { variantId: 14, quantity: 1 },
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(mod.ApiError);
    const apiErr = caught as InstanceType<typeof mod.ApiError>;
    expect(apiErr.code).toBe("REQUEST_ABORTED");
    expect(apiErr.status).toBe(0);
    expect(apiErr.message).toBe("Yêu cầu đã bị huỷ");
  });

  it("ApiError.toString() trả format chứa code+status+message (không phải '[object Error]')", async () => {
    const mod = await loadApi();
    const err = new mod.ApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Phiên đăng nhập đã hết hạn",
    });
    const str = err.toString();
    // Phải chứa đủ 3 thành phần để DevTools console.error({ error }) in ra info hữu ích.
    expect(str).toContain("UNAUTHORIZED");
    expect(str).toContain("401");
    expect(str).toContain("Phiên đăng nhập đã hết hạn");
    // Đảm bảo KHÔNG phải default '[object Error]'.
    expect(str).not.toBe("[object Error]");
  });
});

describe("RefreshToken & Auto-refresh on 401", () => {
  it("getRefreshToken / setRefreshToken / clearRefreshToken lưu trữ trên localStorage", async () => {
    const mod = await loadApi();
    mod.setRefreshToken("test-refresh-token-xyz");
    expect(mod.getRefreshToken()).toBe("test-refresh-token-xyz");

    mod.clearRefreshToken();
    expect(mod.getRefreshToken()).toBeNull();
  });

  it("apiFetch tự động refresh token khi gặp 401 và retry request thành công", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080";
    const mod = await loadApi();
    mod.setAccessToken("expired-token");
    mod.setRefreshToken("valid-refresh-token");

    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      // 1. Request ban đầu bị 401
      if (url.includes("/api/v1/users/me") && fetchMock.mock.calls.length === 1) {
        return new Response(JSON.stringify({ code: "UNAUTHORIZED", message: "Token expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      // 2. Request refresh token thành công
      if (url.includes("/api/v1/auth/refresh-token")) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { accessToken: "new-access-token", refreshToken: "new-refresh-token" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      // 3. Retry request ban đầu thành công với token mới
      if (url.includes("/api/v1/users/me") && fetchMock.mock.calls.length === 3) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 1, email: "user@example.com" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(null, { status: 404 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await mod.apiFetch<{ id: number; email: string }>("/api/v1/users/me");

    expect(result).toEqual({ id: 1, email: "user@example.com" });
    expect(mod.getAccessToken()).toBe("new-access-token");
    expect(mod.getRefreshToken()).toBe("new-refresh-token");
  });

  it("apiFetch ném lỗi 401 và dọn sạch token khi refresh token thất bại", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080";
    const mod = await loadApi();
    mod.setAccessToken("expired-token");
    mod.setRefreshToken("expired-refresh-token");

    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/v1/users/me")) {
        return new Response(JSON.stringify({ code: "UNAUTHORIZED", message: "Token expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("/api/v1/auth/refresh-token")) {
        return new Response(
          JSON.stringify({ code: "REFRESH_TOKEN_EXPIRED", message: "Refresh token expired" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(null, { status: 404 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(mod.apiFetch("/api/v1/users/me")).rejects.toThrow(mod.ApiError);
    expect(mod.getAccessToken()).toBeNull();
    expect(mod.getRefreshToken()).toBeNull();
  });
});

