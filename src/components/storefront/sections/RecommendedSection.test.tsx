/**
 * Test cho RecommendedSection.
 *
 * Coverage:
 * - Render product grid từ useFeaturedProducts()
 * - Loading skeleton
 * - Error state
 * - Empty state
 * - Click product → /products/<id>
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { RecommendedSection } from "./RecommendedSection";
import viMessages from "../../../../messages/vi.json";
import type {
  RecommendedProductResponse,
  RecommendedProductsResponse,
} from "@/features/homepage/api";

const messages = viMessages as unknown as Record<string, unknown>;

const mockData: { value: RecommendedProductsResponse | undefined } = {
  value: undefined,
};
const mockLoading: { value: boolean } = { value: false };
const mockError: { value: boolean } = { value: false };

vi.mock("@/features/homepage/hooks", () => ({
  useRecommendedProducts: () => ({
    data: mockData.value,
    isLoading: mockLoading.value,
    isError: mockError.value,
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

function buildProduct(id: number, name: string): RecommendedProductResponse {
  return {
    id,
    storeId: 1,
    storeName: `Shop ${id}`,
    name,
    imageUrl: `https://example.com/p${id}.jpg`,
    minPrice: 99000,
    maxPrice: 199000,
    totalStock: 50,
    totalSold: 10,
    label: null,
  };
}

beforeEach(() => {
  mockData.value = undefined;
  mockLoading.value = false;
  mockError.value = false;
});

describe("RecommendedSection (using useRecommendedProducts)", () => {
  it("renders 3 tabs (forYou, bestSellers, hotDeals)", async () => {
    mockData.value = { forYou: [], bestSellers: [], hotDeals: [] };
    renderWithProviders(<RecommendedSection />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(3);
  });

  it("renders products from `forYou` array on initial tab", async () => {
    mockData.value = {
      forYou: [buildProduct(1, "Product 1"), buildProduct(2, "Product 2")],
      bestSellers: [buildProduct(3, "Product 3")],
      hotDeals: [buildProduct(4, "Product 4")],
    };
    const { container } = renderWithProviders(<RecommendedSection />);
    await waitFor(() => {
      const links = container.querySelectorAll('a[href^="/products/"]');
      expect(links.length).toBe(2);
    });
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
  });

  it("switches to bestSellers tab and renders correct products", async () => {
    mockData.value = {
      forYou: [buildProduct(1, "Product 1")],
      bestSellers: [buildProduct(10, "Best Seller 1"), buildProduct(11, "Best Seller 2")],
      hotDeals: [],
    };
    renderWithProviders(<RecommendedSection />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]!); // bestSellers tab
    await waitFor(() => {
      expect(screen.getByText("Best Seller 1")).toBeInTheDocument();
      expect(screen.getByText("Best Seller 2")).toBeInTheDocument();
    });
    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
  });

  it("switches to hotDeals tab and renders correct products", async () => {
    mockData.value = {
      forYou: [],
      bestSellers: [],
      hotDeals: [buildProduct(20, "Hot Deal 1")],
    };
    renderWithProviders(<RecommendedSection />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[2]!); // hotDeals tab
    await waitFor(() => {
      expect(screen.getByText("Hot Deal 1")).toBeInTheDocument();
    });
  });

  it("product card link points to /products/<id>", () => {
    mockData.value = {
      forYou: [buildProduct(42, "Product 42")],
      bestSellers: [],
      hotDeals: [],
    };
    renderWithProviders(<RecommendedSection />);
    const link = screen.getByRole("link", { name: /Product 42/i });
    expect(link).toHaveAttribute("href", "/products/42");
  });

  it("shows loading skeleton when isLoading", () => {
    mockLoading.value = true;
    mockData.value = undefined;
    const { container } = renderWithProviders(<RecommendedSection />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when API returns empty arrays", () => {
    mockData.value = { forYou: [], bestSellers: [], hotDeals: [] };
    renderWithProviders(<RecommendedSection />);
    expect(screen.getByText(/trống|chưa có/i)).toBeInTheDocument();
  });

  it("shows error state when API errors", () => {
    mockError.value = true;
    mockData.value = undefined;
    renderWithProviders(<RecommendedSection />);
    expect(
      screen.getByText(/không thể tải|thử lại/i),
    ).toBeInTheDocument();
  });
});

/**
 * Defensive: khi backend trả duplicate id trong cùng list (vd id=195 xuất hiện 2 lần),
 * component PHẢI render 1 card duy nhất và KHÔNG phát React warning duplicate key.
 * Xem stack trace: _RecommendedSectionProductsMap trong dev console.
 */
describe("RecommendedSection – duplicate id defensive", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders only one card when API returns duplicate ids in same tab", async () => {
    const dup = buildProduct(195, "Product 195");
    mockData.value = {
      forYou: [dup, buildProduct(1, "Product 1"), dup],
      bestSellers: [],
      hotDeals: [],
    };
    const { container } = renderWithProviders(<RecommendedSection />);
    await waitFor(() => {
      const links = container.querySelectorAll('a[href^="/products/"]');
      expect(links.length).toBe(2); // dup dedupe → 2 unique
    });
    expect(screen.getByText("Product 195")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
  });

  it("does NOT emit duplicate-key warning when ids collide", async () => {
    const dup = buildProduct(195, "Product 195");
    mockData.value = {
      forYou: [dup, dup],
      bestSellers: [],
      hotDeals: [],
    };
    renderWithProviders(<RecommendedSection />);
    await waitFor(() => {
      expect(screen.getByText("Product 195")).toBeInTheDocument();
    });
    const dupKeyWarnings = consoleErrorSpy.mock.calls.filter((args) =>
      String(args[0] ?? "").includes("two children with the same key"),
    );
    expect(dupKeyWarnings).toHaveLength(0);
  });

  it("keys do not collide when switching tabs (forYou/bestSellers share id)", async () => {
    mockData.value = {
      forYou: [buildProduct(195, "For-You 195")],
      bestSellers: [buildProduct(195, "Best-Seller 195")],
      hotDeals: [],
    };
    const { container } = renderWithProviders(<RecommendedSection />);
    // initial: forYou
    await waitFor(() => {
      expect(screen.getByText("For-You 195")).toBeInTheDocument();
    });
    // switch tab
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]!);
    await waitFor(() => {
      expect(screen.getByText("Best-Seller 195")).toBeInTheDocument();
    });
    // No duplicate-key warning across switch
    const dupKeyWarnings = consoleErrorSpy.mock.calls.filter((args) =>
      String(args[0] ?? "").includes("two children with the same key"),
    );
    expect(dupKeyWarnings).toHaveLength(0);
    expect(container.querySelectorAll('a[href^="/products/"]').length).toBe(1);
  });
});
