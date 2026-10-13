import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductBestSellers } from "@/components/product-detail/ProductBestSellers";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { RecommendedProduct } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const MOCK_BESTSELLERS: RecommendedProduct[] = [
  {
    id: "6",
    name: "Áo Boxy Heavy Cotton",
    imageUrl: "https://lh3.googleusercontent.com/boxy1",
    imageAlt: "Áo Boxy",
    price: 145000,
    rating: 4.9,
    totalSold: 4800,
    href: "/products/ao-boxy-heavy-cotton",
  },
  {
    id: "7",
    name: "Áo thun thể thao Dri-Fit",
    imageUrl: "https://lh3.googleusercontent.com/drifit1",
    imageAlt: "Áo Dri-Fit",
    price: 129000,
    rating: 4.8,
    totalSold: 2100,
    href: "/products/ao-thun-the-thao-dri-fit",
  },
  {
    id: "8",
    name: "Áo thun tay dài sọc ngang",
    imageUrl: "https://lh3.googleusercontent.com/long1",
    imageAlt: "Áo dài",
    price: 169000,
    rating: 4.7,
    totalSold: 950,
    href: "/products/ao-thun-tay-dai-soc-ngang",
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

  test("renders product prices", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    expect(screen.getByText(/145/)).toBeInTheDocument();
    // 4800 formatted with thousand separator: "4.800"
    expect(screen.getByText(/4\.800/)).toBeInTheDocument();
  });

  test("renders ratings when present", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    expect(screen.getByText(/4.9/)).toBeInTheDocument();
  });

  test("renders product images", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(3);
  });

  test("renders links for each product", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  test("renders empty state", () => {
    renderWithIntl(<ProductBestSellers products={[]} />);
    expect(screen.getByTestId("product-best-sellers")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    renderWithIntl(<ProductBestSellers products={MOCK_BESTSELLERS} className="my-custom-class" />);
    expect(screen.getByTestId("product-best-sellers")).toHaveClass("my-custom-class");
  });
});
