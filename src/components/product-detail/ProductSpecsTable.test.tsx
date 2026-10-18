import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ProductSpecsTable } from "./ProductSpecsTable";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { ProductSpecsDto } from "@/features/products";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const SPECS: ProductSpecsDto = {
  origin: "Việt Nam (Xưởng dệt kim UTC Tân Bình)",
  weight: "220g",
  material: "100% Cotton Compact chải kỹ định lượng dày 220gsm",
  warranty: "Bảo hành 30 ngày lỗi nhà sản xuất",
};

describe("ProductSpecsTable", () => {
  it("renders the section title", () => {
    renderWithIntl(<ProductSpecsTable specs={SPECS} />);
    expect(
      screen.getByRole("heading", { name: /Chi Tiết Sản Phẩm/ }),
    ).toBeInTheDocument();
  });

  it("renders all 4 row labels (BE shape)", () => {
    renderWithIntl(<ProductSpecsTable specs={SPECS} />);
    // Use getAllByText to handle potential nested matches (e.g. "Bảo hành" inside "Bảo hành 30 ngày...").
    expect(screen.getAllByText(/Xuất xứ/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Khối lượng/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Chất liệu/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Bảo hành/)[0]).toBeInTheDocument();
  });

  it("renders all 4 row values", () => {
    renderWithIntl(<ProductSpecsTable specs={SPECS} />);
    const root = screen.getByTestId("specs-table");
    const { getByText } = within(root);
    expect(getByText(/Việt Nam/)).toBeInTheDocument();
    expect(getByText("220g")).toBeInTheDocument();
    expect(getByText(/Cotton Compact/)).toBeInTheDocument();
    expect(getByText(/Bảo hành 30 ngày/)).toBeInTheDocument();
  });

  it("renders 4 row containers (BE shape, reduced from 6)", () => {
    renderWithIntl(<ProductSpecsTable specs={SPECS} />);
    const rows = screen.getAllByTestId("spec-row");
    expect(rows).toHaveLength(4);
  });
});