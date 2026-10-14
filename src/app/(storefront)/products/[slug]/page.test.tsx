/**
 * Test cho Product Detail page route /products/[slug].
 *
 * Coverage:
 * - /products/<numeric-id> → fetch by id → redirect sang /products/<slug>
 * - /products/<slug> → fetch by slug → render ProductDetailPage
 * - /products/<slug-unknown> → throw → render not-found
 * - 404 numeric id không tồn tại → notFound()
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { redirect, notFound } from "next/navigation";

const mockFetchById = vi.fn();
const mockFetchBySlug = vi.fn();
const mockSetRequestLocale = vi.fn();

vi.mock("@/features/products", () => ({
  fetchProductDetailById: (id: number) => mockFetchById(id),
  fetchProductDetailBySlug: (slug: string) => mockFetchBySlug(slug),
}));

// Mock redirect + notFound to assert they're called.
// Trong Next.js, redirect() và notFound() throw error đặc biệt (NEXT_REDIRECT / NEXT_NOT_FOUND)
// để framework bắt được. Ở đây ta mô phỏng bằng Error thường.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((_url: string) => {
    throw new Error("NEXT_REDIRECT");
  }) as unknown as typeof import("next/navigation").redirect,
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }) as unknown as typeof import("next/navigation").notFound,
}));

// Mock next-intl/server setRequestLocale (chỉ work trong Server Component context).
vi.mock("next-intl/server", () => ({
  setRequestLocale: (locale: string) => mockSetRequestLocale(locale),
}));

import ProductDetailRoute, {
  generateMetadata,
} from "./page";
import { ApiError } from "@/lib/api";

const sampleProduct = {
  id: 1,
  slug: "ao-thun-unisex-cotton-utc-basic",
  name: "Áo thun unisex cotton UTC Basic",
  description: "Áo thun cotton 220gsm thoáng mát cho mùa hè.",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductDetailRoute - redirect numeric id to slug", () => {
  it("redirects /products/1 to /products/<slug>", async () => {
    mockFetchById.mockResolvedValueOnce(sampleProduct);
    const params = Promise.resolve({ slug: "1" });

    await expect(ProductDetailRoute({ params })).rejects.toThrow("NEXT_REDIRECT");
    expect(mockFetchById).toHaveBeenCalledWith(1);
    expect(redirect).toHaveBeenCalledWith("/products/ao-thun-unisex-cotton-utc-basic");
  });
});

describe("ProductDetailRoute - fetch by slug", () => {
  it("renders ProductDetailPage for valid slug", async () => {
    mockFetchBySlug.mockResolvedValueOnce(sampleProduct);
    const params = Promise.resolve({ slug: "ao-thun-unisex-cotton-utc-basic" });

    const result = await ProductDetailRoute({ params });

    expect(mockFetchBySlug).toHaveBeenCalledWith("ao-thun-unisex-cotton-utc-basic");
    expect(result).toBeDefined();
    expect(redirect).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("calls notFound() when slug not found (404 from API)", async () => {
    const apiError = new ApiError({
      status: 404,
      code: "NOT_FOUND",
      message: "Not Found",
    });
    mockFetchBySlug.mockRejectedValueOnce(apiError);
    const params = Promise.resolve({ slug: "slug-khong-ton-tai" });

    await expect(ProductDetailRoute({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("calls notFound() when numeric id not found (404 from API)", async () => {
    const apiError = new ApiError({
      status: 404,
      code: "NOT_FOUND",
      message: "Not Found",
    });
    mockFetchById.mockRejectedValueOnce(apiError);
    const params = Promise.resolve({ slug: "999" });

    await expect(ProductDetailRoute({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});

describe("generateMetadata", () => {
  it("returns product title for valid slug", async () => {
    mockFetchBySlug.mockResolvedValueOnce(sampleProduct);
    const params = Promise.resolve({ slug: "ao-thun-unisex-cotton-utc-basic" });

    const meta = await generateMetadata({ params });

    expect(meta.title).toContain("Áo thun unisex cotton UTC Basic");
  });

  it("returns 'Đang chuyển hướng...' for numeric id", async () => {
    const params = Promise.resolve({ slug: "1" });

    const meta = await generateMetadata({ params });

    expect(meta.title).toBe("Đang chuyển hướng...");
  });

  it("returns 'Không tìm thấy' for missing slug", async () => {
    mockFetchBySlug.mockResolvedValueOnce(null as never);
    const params = Promise.resolve({ slug: "unknown" });

    const meta = await generateMetadata({ params });

    expect(meta.title).toBe("Không tìm thấy sản phẩm");
  });
});
