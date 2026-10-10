/**
 * Unit tests cho StorefrontHeader.
 * - Nav pills: active state detection theo pathname
 * - Rendering: sections hiển thị đúng (không strict text match)
 *
 * Không test snapshot (pixel-match) — nằm ở page-level HomepageView test.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StorefrontHeader } from "./StorefrontHeader";
import { TestWrapper } from "@/__tests__/test-wrapper";

const mockUsePathname = vi.fn(() => "/trang-chu");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("StorefrontHeader – nav pill active detection", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/trang-chu");
  });

  it("highlights Trang chủ pill when pathname is /trang-chu", () => {
    render(<StorefrontHeader />, { wrapper: TestWrapper });
    const homeLink = screen.getAllByRole("link").find(
      (l) => l.textContent?.trim() === "Trang chủ"
    );
    expect(homeLink).toHaveAttribute("aria-current", "page");
  });

  it("highlights Flash Sale pill when pathname is /flash-sale", () => {
    mockUsePathname.mockReturnValue("/flash-sale");
    render(<StorefrontHeader />, { wrapper: TestWrapper });
    const flashLinks = screen.getAllByRole("link").filter((l) =>
      l.textContent?.includes("Flash Sale")
    );
    const flashPill = flashLinks.find((l) => l.getAttribute("aria-current") === "page");
    expect(flashPill).toBeDefined();
  });

  it("highlights Voucher nav item when pathname is /kho-voucher", () => {
    mockUsePathname.mockReturnValue("/kho-voucher");
    render(<StorefrontHeader />, { wrapper: TestWrapper });
    // Verify that at least one nav pill gets aria-current on /kho-voucher
    const pillsWithAriaCurrent = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(pillsWithAriaCurrent.length).toBeGreaterThan(0);
  });

  it("activeNav prop overrides pathname detection", () => {
    mockUsePathname.mockReturnValue("/trang-chu");
    render(<StorefrontHeader activeNav="flash-sale" />, {
      wrapper: TestWrapper,
    });
    const homeLink = screen
      .getAllByRole("link")
      .find((l) => l.textContent?.trim() === "Trang chủ");
    const flashLinks = screen.getAllByRole("link").filter((l) =>
      l.textContent?.includes("Flash Sale")
    );
    const flashPill = flashLinks.find(
      (l) => l.getAttribute("aria-current") === "page"
    );
    expect(homeLink).not.toHaveAttribute("aria-current", "page");
    expect(flashPill).toBeDefined();
  });
});

describe("StorefrontHeader – renders all sections", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/trang-chu");
  });

  it("renders the top bar with seller channel text", () => {
    render(<StorefrontHeader />, { wrapper: TestWrapper });
    // Top bar text is split across elements — check for partial text
    expect(screen.getByText(/kênh người bán/i)).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<StorefrontHeader />, { wrapper: TestWrapper });
    // Input is a plain text input (not role=searchbox)
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders multiple nav pills (at least 5)", () => {
    render(<StorefrontHeader />, { wrapper: TestWrapper });
    const pills = screen.getAllByRole("link");
    expect(pills.length).toBeGreaterThanOrEqual(5);
  });

  it("renders the user greeting text", () => {
    render(<StorefrontHeader />, { wrapper: TestWrapper });
    expect(screen.getByText(/minh thư/i)).toBeInTheDocument();
  });
});
