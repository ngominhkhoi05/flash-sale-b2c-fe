import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductRelatedStores } from "@/components/product-detail/ProductRelatedStores";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { RelatedProductSummary } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const MOCK_RELATED: RelatedProductSummary[] = [
  {
    id: 2,
    storeId: 1,
    storeName: "UTC Fashion",
    categoryId: 10,
    categoryName: "Áo thun",
    name: "Quần short kaki co giãn",
    imageUrl: "https://lh3.googleusercontent.com/short1",
    minPrice: 139000,
    maxPrice: 159000,
    totalStock: 50,
    status: "ACTIVE",
    createdAt: "2026-10-12T00:00:00Z",
  },
  {
    id: 3,
    storeId: 1,
    storeName: "UTC Fashion",
    categoryId: 10,
    categoryName: "Áo thun",
    name: "Áo polo pique thoáng mát",
    imageUrl: "https://lh3.googleusercontent.com/polo1",
    minPrice: 189000,
    maxPrice: 189000,
    totalStock: 30,
    status: "ACTIVE",
    createdAt: "2026-10-12T00:00:00Z",
  },
  {
    id: 4,
    storeId: 1,
    storeName: "UTC Fashion",
    categoryId: 10,
    categoryName: "Áo thun",
    name: "Áo thun oversize graphic",
    imageUrl: "https://lh3.googleusercontent.com/oversize1",
    minPrice: 179000,
    maxPrice: 199000,
    totalStock: 80,
    status: "ACTIVE",
    createdAt: "2026-10-12T00:00:00Z",
  },
  {
    id: 5,
    storeId: 1,
    storeName: "UTC Fashion",
    categoryId: 10,
    categoryName: "Áo thun",
    name: "Quần jogger niềng cotton",
    imageUrl: "https://lh3.googleusercontent.com/jogger1",
    minPrice: 219000,
    maxPrice: 239000,
    totalStock: 25,
    status: "ACTIVE",
    createdAt: "2026-10-12T00:00:00Z",
  },
];

describe("ProductRelatedStores", () => {
  test("renders section heading", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  test("renders product list", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    expect(screen.getByText("Quần short kaki co giãn")).toBeInTheDocument();
    expect(screen.getByText("Áo polo pique thoáng mát")).toBeInTheDocument();
  });

  test("renders product prices formatted in VND", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    // Price formatted (139.000 ₫)
    expect(screen.getByText(/139/)).toBeInTheDocument();
    // Store name displayed
    expect(screen.getAllByText(/UTC Fashion/).length).toBeGreaterThanOrEqual(1);
  });

  test("renders product images", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(4);
  });

  test("renders links for each product with /products/<id> href", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(4);
    // href generated from numeric id
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/products/2");
    expect(hrefs).toContain("/products/3");
  });

  test("renders see all link", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    expect(screen.getByRole("link", { name: /xem hết/i })).toBeInTheDocument();
  });

  test("renders empty state when products=[]", () => {
    renderWithIntl(<ProductRelatedStores products={[]} />);
    expect(screen.getByTestId("product-related-stores")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    renderWithIntl(
      <ProductRelatedStores products={MOCK_RELATED} className="my-custom-class" />,
    );
    expect(screen.getByTestId("product-related-stores")).toHaveClass("my-custom-class");
  });
});

describe("ProductRelatedStores – defensive guards (BE nullable)", () => {
  test("does NOT crash when products is undefined (BE missing field)", () => {
    expect(() =>
      renderWithIntl(
        <ProductRelatedStores
          products={undefined as unknown as RelatedProductSummary[]}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByTestId("product-related-stores")).toBeInTheDocument();
  });

  test("does NOT crash when products is null (BE explicit null)", () => {
    expect(() =>
      renderWithIntl(
        <ProductRelatedStores
          products={null as unknown as RelatedProductSummary[]}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByTestId("product-related-stores")).toBeInTheDocument();
  });
});

describe("ProductRelatedStores – duplicate id defensive", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("renders only one link when API returns duplicate ids", () => {
    const dup: RelatedProductSummary = {
      ...MOCK_RELATED[0]!,
      id: 99,
      name: "Sản phẩm duplicate",
      imageUrl: "https://example.com/dup.jpg",
    };
    renderWithIntl(
      <ProductRelatedStores products={[dup, dup, MOCK_RELATED[0]!]} />,
    );
    const dupLinks = screen.getAllByRole("link", {
      name: /Sản phẩm duplicate/i,
    });
    expect(dupLinks.length).toBe(1);
    expect(screen.getByText("Quần short kaki co giãn")).toBeInTheDocument();
  });

  test("does NOT emit duplicate-key warning when ids collide", () => {
    const dup: RelatedProductSummary = {
      ...MOCK_RELATED[0]!,
      id: 99,
      name: "Sản phẩm duplicate",
      imageUrl: "https://example.com/dup.jpg",
    };
    renderWithIntl(<ProductRelatedStores products={[dup, dup]} />);
    const dupKeyWarnings = consoleErrorSpy.mock.calls.filter((args) =>
      String(args[0] ?? "").includes("two children with the same key"),
    );
    expect(dupKeyWarnings).toHaveLength(0);
  });
});