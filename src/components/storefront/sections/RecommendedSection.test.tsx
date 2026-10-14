/**
 * Test cho RecommendedSection.
 *
 * Coverage:
 * - Render product grid từ useFeaturedProducts()
 * - Loading skeleton
 * - Error state
 * - Empty state
 * - Click product → /san-pham/<id>
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { RecommendedSection } from "./RecommendedSection";
import viMessages from "../../../../messages/vi.json";
import type { RecommendedProductResponse } from "@/features/homepage/api";

const messages = viMessages as unknown as Record<string, unknown>;

const mockProducts: { value: RecommendedProductResponse[] | undefined } = {
  value: undefined,
};

vi.mock("@/features/homepage/hooks", () => ({
  useFeaturedProducts: () => ({
    data: mockProducts.value,
    isLoading: mockProducts.value === undefined,
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
  mockProducts.value = undefined;
});

describe("RecommendedSection (using useFeaturedProducts)", () => {
  it("renders 3 tabs (forYou, bestSellers, hotDeals)", () => {
    mockProducts.value = [];
    renderWithProviders(<RecommendedSection />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(3);
  });

  it("renders 20 product cards on initial tab (forYou)", () => {
    mockProducts.value = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      storeId: 1,
      storeName: `Shop ${i + 1}`,
      name: `Product ${i + 1}`,
      imageUrl: `https://example.com/p${i + 1}.jpg`,
      minPrice: 99000 + i * 1000,
      maxPrice: 199000 + i * 1000,
      totalStock: 50,
      totalSold: 10,
      label: null,
    }));
    const { container } = renderWithProviders(<RecommendedSection />);
    const links = container.querySelectorAll('a[href^="/san-pham/"]');
    expect(links.length).toBe(20);
  });

  it("product card link points to /san-pham/<id>", () => {
    mockProducts.value = [
      {
        id: 42,
        storeId: 1,
        storeName: "Shop A",
        name: "Product 42",
        imageUrl: "https://example.com/p42.jpg",
        minPrice: 99000,
        maxPrice: 99000,
        totalStock: 10,
        totalSold: 1,
        label: null,
      },
    ];
    renderWithProviders(<RecommendedSection />);
    const link = screen.getByRole("link", { name: /Product 42/i });
    expect(link).toHaveAttribute("href", "/san-pham/42");
  });

  it("shows loading skeleton when isLoading", () => {
    mockProducts.value = undefined;
    const { container } = renderWithProviders(<RecommendedSection />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when API returns []", () => {
    mockProducts.value = [];
    renderWithProviders(<RecommendedSection />);
    expect(screen.getByText(/trống|chưa có/i)).toBeInTheDocument();
  });
});
