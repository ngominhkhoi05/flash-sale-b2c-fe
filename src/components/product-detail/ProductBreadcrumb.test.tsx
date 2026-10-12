import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductBreadcrumb } from "./ProductBreadcrumb";
import { TestWrapper } from "@/__tests__/test-wrapper";

const mockUseRouter = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => mockUseRouter(),
}));

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductBreadcrumb", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({ push: vi.fn(), replace: vi.fn() });
  });

  it("renders category and product name", () => {
    renderWithIntl(
      <ProductBreadcrumb
        categoryName="Thời trang Unisex"
        productName="Áo thun cotton UTC"
      />
    );
    expect(screen.getByText("Thời trang Unisex")).toBeInTheDocument();
    expect(screen.getByText("Áo thun cotton UTC")).toBeInTheDocument();
  });

  it("renders home link to /", () => {
    renderWithIntl(
      <ProductBreadcrumb
        categoryName="Thời trang Unisex"
        productName="Áo thun"
      />
    );
    const homeLinks = screen.getAllByRole("link").filter(
      (l) => l.getAttribute("href") === "/"
    );
    expect(homeLinks.length).toBeGreaterThan(0);
  });

  it("uses aria-label Breadcrumb on nav", () => {
    renderWithIntl(
      <ProductBreadcrumb
        categoryName="Thời trang"
        productName="Sản phẩm"
      />
    );
    expect(screen.getByRole("navigation", { name: /Breadcrumb/i })).toBeInTheDocument();
  });
});
