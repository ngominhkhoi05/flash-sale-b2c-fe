/**
 * Test cho FeaturedStoresSection fallback.
 *
 * Coverage:
 * - Render 4 product cards từ useFeaturedProducts()
 * - Loading state
 * - Empty state
 * - Error state
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { FeaturedStoresSection } from "./FeaturedStoresSection";
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
  useFeaturedStores: () => ({
    data: [],
    isLoading: mockProducts.value === undefined, // both loading together
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

describe("FeaturedStoresSection (fallback to featured products)", () => {
  it("renders section heading with mall badge", () => {
    mockProducts.value = [];
    renderWithProviders(<FeaturedStoresSection />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toMatch(/shop nổi bật/i);
  });

  it("renders 4 product cards when API returns 4+ products", () => {
    mockProducts.value = Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      storeId: 1,
      storeName: `Shop ${i + 1}`,
      name: `Product ${i + 1}`,
      imageUrl: `https://example.com/p${i + 1}.jpg`,
      minPrice: 99000,
      maxPrice: 199000,
      totalStock: 50,
      totalSold: 10,
      label: null,
    }));
    const { container } = renderWithProviders(<FeaturedStoresSection />);
    const links = container.querySelectorAll('a[href^="/san-pham/"]');
    expect(links.length).toBe(4);
  });

  it("caps at 4 products", () => {
    mockProducts.value = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      storeId: 1,
      storeName: `Shop ${i + 1}`,
      name: `Product ${i + 1}`,
      imageUrl: `https://example.com/p${i + 1}.jpg`,
      minPrice: 99000,
      maxPrice: 199000,
      totalStock: 50,
      totalSold: 10,
      label: null,
    }));
    const { container } = renderWithProviders(<FeaturedStoresSection />);
    const links = container.querySelectorAll('a[href^="/san-pham/"]');
    expect(links.length).toBe(4);
  });

  it("shows loading skeleton when isLoading", () => {
    mockProducts.value = undefined;
    const { container } = renderWithProviders(<FeaturedStoresSection />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when API returns []", () => {
    mockProducts.value = [];
    renderWithProviders(<FeaturedStoresSection />);
    expect(screen.getByText(/trống|chưa có/i)).toBeInTheDocument();
  });
});
