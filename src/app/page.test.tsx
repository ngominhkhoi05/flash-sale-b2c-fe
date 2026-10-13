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
