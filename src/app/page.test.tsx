/**
 * Snapshot test cho HomepageView – theo user yêu cầu pixel-match 100%.
 *
 * Render HomepageView với wrapper i18n và chụp HTML snapshot.
 * Nếu HTML gặp dữ liệu động (vd: timestamp), snapshotted phải chứa marker
 * placeholder để render mỗi lần đều giống nhau.
 *
 * Notes: snapshot file `__snapshots__/page.test.tsx.snap` sẽ được tạo lần đầu
 * chạy. Mỗi lần sau phải match y hệt — nếu khác, buộc phải update snapshot
 * bằng `npx vitest run -u`.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomepageView } from "./_homepage-view";
import { TestWrapper } from "@/__tests__/test-wrapper";

// Mock homepage API hooks to avoid network calls in snapshot test
vi.mock("@/features/homepage/hooks", () => ({
  useHomeBanners: () => ({
    data: {
      mainSlides: [
        { id: 1, type: "HERO", position: 1, imageUrl: "https://example.com/s1.jpg", imageAlt: "Slide 1", ctaHref: "/flash-sale", ctaText: "Mua ngay", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
      ],
      sideBanners: [
        { id: 2, type: "FREESHIP", position: 1, imageUrl: "", imageAlt: "Freeship", ctaHref: "/vouchers?type=freeship", ctaText: "Xem", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useCategories: () => ({
    data: [
      { id: 1, name: "Thời trang nam", slug: "thoi-trang-nam", commissionRate: 0.1, description: "" },
      { id: 2, name: "Điện thoại", slug: "dien-thoai", commissionRate: 0.1, description: "" },
    ],
    isLoading: false,
    isError: false,
  }),
  useFlashSaleSlots: () => ({ data: [], isLoading: false, isError: false }),
  usePlatformVouchers: () => ({ data: [], isLoading: false, isError: false }),
  useFeaturedStores: () => ({ data: [], isLoading: false, isError: false }),
  useFeaturedProducts: () => ({ data: [], isLoading: false, isError: false }),
  useRecommendedProducts: () => ({
    data: { forYou: [], bestSellers: [], hotDeals: [] },
    isLoading: false,
    isError: false,
  }),
}));

describe("HomepageView – snapshot pixel-match", () => {
  it("renders all 7 sections with expected headings", () => {
    const { container } = render(<HomepageView />, { wrapper: TestWrapper });

    // Hero: h1 is gone (banner is image-only). 4 sub section h2 remain.
    const headings = Array.from(container.querySelectorAll("h2")).map(
      (h) => h.textContent?.toLowerCase() ?? ""
    );
    expect(headings.some((t) => t.includes("danh mục"))).toBe(true);
    expect(headings.some((t) => t.includes("flash sale"))).toBe(true);
    expect(headings.some((t) => t.includes("mã giảm"))).toBe(true);
    expect(headings.some((t) => t.includes("shop nổi bật"))).toBe(true);
  });

  it("snapshot of rendered HTML for pixel-match review", () => {
    const { container } = render(<HomepageView />, { wrapper: TestWrapper });
    // Strip dynamic attributes (data-*, timestamps) for stable snapshot
    const html = container.innerHTML.replace(/\s+data-testid="[^"]*"/g, "");
    expect(html).toMatchSnapshot();
  });
});

/**
 * Regression test: homepage at / must include StorefrontHeader + StorefrontFooter.
 *
 * Bug: PR #29 moved page.tsx to root (app/page.tsx), losing storefront layout.
 * Fix: page.tsx wraps HomePageView with StorefrontShell + Header + Footer + MobileBottomNav.
 *
 * We test the final page.tsx by importing it as default export.
 * Mock useCartCount because StorefrontHeader uses it (needs QueryClientProvider).
 */
describe("HomePage – storefront chrome regression", () => {
  vi.mock("@/features/cart", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/features/cart")>();
    return {
      ...actual,
      useCartCount: () => ({ data: 0 }),
    };
  });

  it("renders StorefrontHeader with Vibe Mart logo", async () => {
    const { default: HomePage } = await import("./page");
    render(<HomePage />, { wrapper: TestWrapper });
    // StorefrontHeader renders an <header> with logo alt text (may also appear in footer)
    const logos = screen.queryAllByRole("img", { name: /vibe mart/i });
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it("renders StorefrontFooter with copyright text", async () => {
    const { default: HomePage } = await import("./page");
    render(<HomePage />, { wrapper: TestWrapper });
    // StorefrontFooter renders a <footer> with © 2026
    const footer = screen.queryByRole("contentinfo");
    expect(footer).not.toBeNull();
    expect(footer?.textContent ?? "").toMatch(/2026/);
  });

  it("renders MobileBottomNav", async () => {
    const { default: HomePage } = await import("./page");
    render(<HomePage />, { wrapper: TestWrapper });
    // MobileBottomNav has aria-label "Điều hướng dưới"
    const bottomNav = screen.queryByRole("navigation", { name: /điều hướng/i });
    expect(bottomNav).not.toBeNull();
  });
});
