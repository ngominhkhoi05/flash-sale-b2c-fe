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
