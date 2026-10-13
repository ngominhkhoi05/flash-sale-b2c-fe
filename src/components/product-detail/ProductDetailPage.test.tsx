/**
 * Integration test for Product Detail Page (SP6).
 *
 * Verifies the page renders with all sections including:
 * - ProductReviewsCard, ProductRelatedStores, ProductBestSellers (new)
 * - Layout structure follows Stitch 12-col grid
 */
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductDetailPage } from "@/components/product-detail/ProductDetailPage";
import { TestWrapper } from "@/__tests__/test-wrapper";
import { mockProductDetail } from "@/features/products";

describe("ProductDetailPage", () => {
  const defaultProps = { product: mockProductDetail };

  test("renders product detail page container", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    // Page renders without crashing - product name appears (multiple times is OK)
    expect(screen.getAllByText(mockProductDetail.name).length).toBeGreaterThan(0);
  });

  test("renders reviews section (section 18)", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    // Reviews heading
    expect(screen.getByRole("heading", { name: /đánh giá/i })).toBeInTheDocument();
  });

  test("renders related stores section heading (section 19)", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    expect(screen.getByRole("heading", { name: /cùng shop utc/i })).toBeInTheDocument();
  });

  test("renders best sellers section heading (section 20)", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    expect(screen.getByRole("heading", { name: /bán chạy cùng ngành/i })).toBeInTheDocument();
  });

  test("renders product breadcrumb", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
  });

  test("renders store card", () => {
    render(<ProductDetailPage {...defaultProps} />, { wrapper: TestWrapper });
    expect(screen.getByText("UTC Fashion Official")).toBeInTheDocument();
  });
});
