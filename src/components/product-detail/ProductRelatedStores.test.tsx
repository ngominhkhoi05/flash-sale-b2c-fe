import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductRelatedStores } from "@/components/product-detail/ProductRelatedStores";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { RecommendedProduct } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const MOCK_RELATED: RecommendedProduct[] = [
  {
    id: "2",
    name: "Quần short kaki co giãn",
    imageUrl: "https://lh3.googleusercontent.com/short1",
    imageAlt: "Quần short kaki",
    price: 139000,
    totalSold: 890,
    href: "/products/quan-short-kaki",
  },
  {
    id: "3",
    name: "Áo polo pique thoáng mát",
    imageUrl: "https://lh3.googleusercontent.com/polo1",
    imageAlt: "Áo polo xanh navy",
    price: 189000,
    totalSold: 1400,
    href: "/products/ao-polo-pique",
  },
  {
    id: "4",
    name: "Áo thun oversize graphic",
    imageUrl: "https://lh3.googleusercontent.com/oversize1",
    imageAlt: "Áo thun oversize",
    price: 179000,
    totalSold: 3200,
    href: "/products/ao-thun-oversize",
  },
  {
    id: "5",
    name: "Quần jogger niềng cotton",
    imageUrl: "https://lh3.googleusercontent.com/jogger1",
    imageAlt: "Quần jogger",
    price: 219000,
    totalSold: 640,
    href: "/products/quan-jogger",
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

  test("renders product prices", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    // Price formatted (139.000 ₫)
    expect(screen.getByText(/139/)).toBeInTheDocument();
    expect(screen.getByText(/890/)).toBeInTheDocument(); // sold count
  });

  test("renders product images", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(4);
  });

  test("renders links for each product", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(4);
  });

  test("renders see all link", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} />);
    expect(screen.getByRole("link", { name: /xem hết/i })).toBeInTheDocument();
  });

  test("renders empty state", () => {
    renderWithIntl(<ProductRelatedStores products={[]} />);
    expect(screen.getByTestId("product-related-stores")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    renderWithIntl(<ProductRelatedStores products={MOCK_RELATED} className="my-custom-class" />);
    expect(screen.getByTestId("product-related-stores")).toHaveClass("my-custom-class");
  });
});

describe("ProductRelatedStores – defensive guards (BE nullable)", () => {
  test("does NOT crash when products is undefined (BE missing field)", () => {
    expect(() =>
      renderWithIntl(
        <ProductRelatedStores products={undefined as unknown as RecommendedProduct[]} />,
      ),
    ).not.toThrow();
    // Empty state should still render.
    expect(screen.getByTestId("product-related-stores")).toBeInTheDocument();
  });

  test("does NOT crash when products is null (BE explicit null)", () => {
    expect(() =>
      renderWithIntl(
        <ProductRelatedStores products={null as unknown as RecommendedProduct[]} />,
      ),
    ).not.toThrow();
    expect(screen.getByTestId("product-related-stores")).toBeInTheDocument();
  });
});

/**
 * Defensive: khi backend trả duplicate id, component PHẢI render 1 link
 * duy nhất và KHÔNG phát React warning duplicate key.
 */
describe("ProductRelatedStores – duplicate id defensive", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("renders only one link when API returns duplicate ids", () => {
    const dup: RecommendedProduct = {
      id: "99",
      name: "Sản phẩm duplicate",
      imageUrl: "https://example.com/dup.jpg",
      imageAlt: "dup",
      price: 100000,
      href: "/products/dup",
    };
    renderWithIntl(
      <ProductRelatedStores products={[dup, dup, MOCK_RELATED[0]!]} />,
    );
    const dupLinks = screen.getAllByRole("link", { name: /Sản phẩm duplicate/i });
    expect(dupLinks.length).toBe(1);
    expect(screen.getByText("Quần short kaki co giãn")).toBeInTheDocument();
  });

  test("does NOT emit duplicate-key warning when ids collide", () => {
    const dup: RecommendedProduct = {
      id: "99",
      name: "Sản phẩm duplicate",
      imageUrl: "https://example.com/dup.jpg",
      imageAlt: "dup",
      price: 100000,
      href: "/products/dup",
    };
    renderWithIntl(<ProductRelatedStores products={[dup, dup]} />);
    const dupKeyWarnings = consoleErrorSpy.mock.calls.filter((args) =>
      String(args[0] ?? "").includes("two children with the same key"),
    );
    expect(dupKeyWarnings).toHaveLength(0);
  });
});
