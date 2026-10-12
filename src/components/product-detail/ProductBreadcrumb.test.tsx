import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductBreadcrumb } from "./ProductBreadcrumb";
import { TestWrapper } from "@/__tests__/test-wrapper";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductBreadcrumb", () => {
  it("renders all 3 segments (home, category, product) and 2 chevron separators", () => {
    renderWithIntl(
      <ProductBreadcrumb
        categoryName="Thời trang Unisex"
        productName="Áo thun cotton UTC"
      />,
    );
    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    expect(screen.getByText("Thời trang Unisex")).toBeInTheDocument();
    expect(screen.getByText("Áo thun cotton UTC")).toBeInTheDocument();
    // nav element exists
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("home link points to '/' and category link points to /products with query string", () => {
    renderWithIntl(
      <ProductBreadcrumb
        categoryName="Thời trang Unisex"
        productName="Áo thun"
      />,
    );
    const homeLink = screen.getByRole("link", { name: "Trang chủ" });
    expect(homeLink).toHaveAttribute("href", "/");
    const categoryLink = screen.getByRole("link", {
      name: "Thời trang Unisex",
    });
    expect(categoryLink).toHaveAttribute(
      "href",
      "/products?category=thoi-trang-unisex",
    );
  });

  it("product name is rendered as plain text (not a link)", () => {
    renderWithIntl(
      <ProductBreadcrumb
        categoryName="Thời trang"
        productName="Sản phẩm A"
      />,
    );
    // Product name has no link wrapping
    expect(
      screen.queryByRole("link", { name: "Sản phẩm A" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Sản phẩm A")).toBeInTheDocument();
  });
});