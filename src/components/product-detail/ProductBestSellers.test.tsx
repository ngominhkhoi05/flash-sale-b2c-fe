import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductBestSellers } from "@/components/product-detail/ProductBestSellers";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { RelatedProductSummary } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const MOCK_BESTSELLERS: RelatedProductSummary[] = [
  {
    id: 6,
    storeId: 2,
    storeName: "Vibe Mart",
    categoryId: 10,
    categoryName: "Áo thun",
    name: "Áo Boxy Heavy Cotton",
    imageUrl: "https://lh3.googleusercontent.com/boxy1",
    minPrice: 145000,
    maxPrice: 145000,
    totalStock: 100,
    status: "ACTIVE",
    createdAt: "2026-10-12T00:00:00Z",
  },
  {
    id: 7,
    storeId: 2,
    storeName: "Vibe Mart",
    categoryId: 10,
    categoryName: "Áo thun",
    name: "Áo thun thể thao Dri-Fit",
    imageUrl: "https://lh3.googleusercontent.com/drifit1",
    minPrice: 129000,
    maxPrice: 129000,
    totalStock: 75,
    status: "ACTIVE",
    createdAt: "2026-10-12T00:00:00Z",
  },
  {
    id: 8,
    storeId: 2,
    storeName: "Vibe Mart",
    categoryId: 10,
    categoryName: "Áo thun",
    name: "Áo thun tay dài sọc ngang",
    imageUrl: "https://lh3.googleusercontent.com/long1",
    minPrice: 169000,
    maxPrice: 169000,
    totalStock: 50,
    status: "ACTIVE",
    createdAt: "2026-10-12T00:00:00Z",
  },
];

describe("ProductBestSellers", () => {
  test("renders section heading", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  test("renders product list", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    expect(screen.getByText("Áo Boxy Heavy Cotton")).toBeInTheDocument();
    expect(screen.getByText("Áo thun thể thao Dri-Fit")).toBeInTheDocument();
  });

  test("renders product prices formatted in VND", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    expect(screen.getByText(/145/)).toBeInTheDocument();
  });

  test("renders store name + total stock for each item", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    expect(screen.getAllByText(/Vibe Mart/).length).toBeGreaterThanOrEqual(3);
    // totalStock 100 / 75 / 50
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/75/)).toBeInTheDocument();
  });

  test("renders product images", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(3);
  });

  test("renders links for each product with /products/<id> href", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/products/6");
    expect(hrefs).toContain("/products/7");
    expect(hrefs).toContain("/products/8");
  });

  test("renders empty state when products=[]", () => {
    renderWithIntl(<ProductBestSellers products={[]} />);
    expect(screen.getByTestId("product-best-sellers")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    renderWithIntl(
      <ProductBestSellers products={MOCK_BESTSELLERS} className="my-custom-class" />,
    );
    expect(screen.getByTestId("product-best-sellers")).toHaveClass("my-custom-class");
  });
});

describe("ProductBestSellers – defensive guards (BE nullable)", () => {
  test("does NOT crash when products is undefined (BE missing field)", () => {
    expect(() =>
      renderWithIntl(
        <ProductBestSellers
          products={undefined as unknown as RelatedProductSummary[]}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByTestId("product-best-sellers")).toBeInTheDocument();
  });

  test("does NOT crash when products is null (BE explicit null)", () => {
    expect(() =>
      renderWithIntl(
        <ProductBestSellers
          products={null as unknown as RelatedProductSummary[]}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByTestId("product-best-sellers")).toBeInTheDocument();
  });
});

describe("ProductBestSellers – duplicate id defensive", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("renders only one link when API returns duplicate ids", () => {
    const dup: RelatedProductSummary = {
      ...MOCK_BESTSELLERS[0]!,
      id: 99,
      name: "Áo duplicate",
      imageUrl: "https://example.com/dup.jpg",
    };
    renderWithIntl(
      <ProductBestSellers products={[dup, dup, MOCK_BESTSELLERS[0]!]} />,
    );
    const dupLinks = screen.getAllByRole("link", { name: /Áo duplicate/i });
    expect(dupLinks.length).toBe(1);
    expect(screen.getByText("Áo Boxy Heavy Cotton")).toBeInTheDocument();
  });

  test("does NOT emit duplicate-key warning when ids collide", () => {
    const dup: RelatedProductSummary = {
      ...MOCK_BESTSELLERS[0]!,
      id: 99,
      name: "Áo duplicate",
      imageUrl: "https://example.com/dup.jpg",
    };
    renderWithIntl(<ProductBestSellers products={[dup, dup]} />);
    const dupKeyWarnings = consoleErrorSpy.mock.calls.filter((args) =>
      String(args[0] ?? "").includes("two children with the same key"),
    );
    expect(dupKeyWarnings).toHaveLength(0);
  });
});