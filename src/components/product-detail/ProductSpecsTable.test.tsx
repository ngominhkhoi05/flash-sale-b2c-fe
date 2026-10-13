import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ProductSpecsTable } from "./ProductSpecsTable";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { ProductSpecs } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const SPECS: ProductSpecs = {
  category: "Vibe Mart > Thời trang Unisex > Áo thun cổ tròn",
  material: "100% Cotton Compact chải kỹ định lượng dày 220gsm",
  origin: "Việt Nam (Xưởng dệt kim UTC Tân Bình)",
  style: "Unisex suông vừa Regular Fit, tay lỡ nhẹ thoải mái",
  sku: "UTC-TS-001-WHT",
  careInstructions:
    "Giặt máy chế độ êm, lộn trái khi giặt và phơi bóng râm",
};

describe("ProductSpecsTable", () => {
  it("renders the section title", () => {
    renderWithIntl(<ProductSpecsTable specs={SPECS} />);
    expect(
      screen.getByRole("heading", { name: /Chi Tiết Sản Phẩm/ })
    ).toBeInTheDocument();
  });

  it("renders all 6 row labels", () => {
    renderWithIntl(<ProductSpecsTable specs={SPECS} />);
    expect(screen.getByText(/Danh mục/)).toBeInTheDocument();
    expect(screen.getByText(/Chất liệu/)).toBeInTheDocument();
    expect(screen.getByText(/Xuất xứ/)).toBeInTheDocument();
    expect(screen.getByText(/Kiểu dáng/)).toBeInTheDocument();
    expect(screen.getByText(/Mã SKU/)).toBeInTheDocument();
    expect(screen.getByText(/Hướng dẫn/)).toBeInTheDocument();
  });

  it("renders all 6 row values", () => {
    renderWithIntl(<ProductSpecsTable specs={SPECS} />);
    const root = screen.getByTestId("specs-table");
    const { getByText } = within(root);
    expect(getByText(/Vibe Mart/)).toBeInTheDocument();
    expect(getByText(/Cotton Compact/)).toBeInTheDocument();
    expect(getByText(/Việt Nam/)).toBeInTheDocument();
    expect(getByText(/Regular Fit/)).toBeInTheDocument();
    expect(getByText(/UTC-TS-001-WHT/)).toBeInTheDocument();
    expect(getByText(/Giặt máy chế độ êm/)).toBeInTheDocument();
  });

  it("renders 6 row containers", () => {
    renderWithIntl(<ProductSpecsTable specs={SPECS} />);
    const rows = screen.getAllByTestId("spec-row");
    expect(rows).toHaveLength(6);
  });
});
