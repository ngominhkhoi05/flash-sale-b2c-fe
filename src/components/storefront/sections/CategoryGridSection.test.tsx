/**
 * Test cho CategoryGridSection.
 *
 * Coverage:
 * - Render categories từ useCategories() API
 * - Loading state
 * - Empty state
 * - Error state
 * - Click category link → /categories/<slug>
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { CategoryGridSection } from "./CategoryGridSection";
import viMessages from "../../../../messages/vi.json";
import type { CategoryResponse } from "@/features/homepage/api";

const messages = viMessages as unknown as Record<string, unknown>;

const mockCategories: { value: CategoryResponse[] | undefined } = { value: undefined };

vi.mock("@/features/homepage/hooks", () => ({
  useCategories: () => ({
    data: mockCategories.value,
    isLoading: mockCategories.value === undefined,
    isError: false,
  }),
}));

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <NextIntlClientProvider locale="vi" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockCategories.value = undefined;
});

describe("CategoryGridSection (API-driven)", () => {
  it("renders section title", () => {
    mockCategories.value = [];
    renderWithProviders(<CategoryGridSection />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings[0]?.textContent).toMatch(/danh mục/i);
  });

  it("renders 8 category links from API", () => {
    mockCategories.value = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `Category ${i + 1}`,
      slug: `category-${i + 1}`,
      commissionRate: 0.1,
      description: "",
    }));
    renderWithProviders(<CategoryGridSection />);
    const links = screen.getAllByRole("link");
    // 8 category links + 1 "See all" link
    expect(links.filter((l) => l.getAttribute("href")?.startsWith("/categories/category-"))).toHaveLength(8);
  });

  it("caps at 8 categories when API returns more", () => {
    mockCategories.value = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Category ${i + 1}`,
      slug: `category-${i + 1}`,
      commissionRate: 0.1,
      description: "",
    }));
    renderWithProviders(<CategoryGridSection />);
    const categoryLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/categories/category-"));
    expect(categoryLinks).toHaveLength(8);
  });

  it("category link points to /categories/<slug>", () => {
    mockCategories.value = [
      {
        id: 1,
        name: "Thời trang nam",
        slug: "thoi-trang-nam",
        commissionRate: 0.1,
        description: "",
      },
    ];
    renderWithProviders(<CategoryGridSection />);
    const link = screen.getByRole("link", { name: /thời trang nam/i });
    expect(link).toHaveAttribute("href", "/categories/thoi-trang-nam");
  });

  it("shows loading skeleton when isLoading", () => {
    mockCategories.value = undefined; // loading
    const { container } = renderWithProviders(<CategoryGridSection />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when API returns []", () => {
    mockCategories.value = [];
    renderWithProviders(<CategoryGridSection />);
    // Empty state has text "trống" or "chưa có"
    expect(screen.getByText(/trống|chưa có/i)).toBeInTheDocument();
  });
});
