/**
 * ProductVariantSelectors – Sections 12.
 * Tests: Color chip selection, Size chip selection, disabled size, active outline, size guide link.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductVariantSelectors } from "./ProductVariantSelectors";
import { TestWrapper } from "@/__tests__/test-wrapper";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const COLORS = [
  { name: "Trắng Tinh Khôi", bgClass: "bg-slate-100" },
  { name: "Đen Huyền Bí", bgClass: "bg-slate-900" },
  { name: "Vàng Pastel", bgClass: "bg-amber-200" },
];

const SIZES = [
  { label: "S" },
  { label: "M" },
  { label: "L" },
  { label: "XL", disabled: true },
];

describe("ProductVariantSelectors", () => {
  it("renders color labels and chips for every color", () => {
    renderWithIntl(
      <ProductVariantSelectors
        colors={COLORS}
        sizes={SIZES}
        selectedColor="Trắng Tinh Khôi"
        selectedSize="M"
        onColorChange={() => {}}
        onSizeChange={() => {}}
      />
    );
    expect(screen.getByText("Màu Sắc:")).toBeInTheDocument();
    expect(screen.getByText("Trắng Tinh Khôi")).toBeInTheDocument();
    expect(screen.getByText("Đen Huyền Bí")).toBeInTheDocument();
    expect(screen.getByText("Vàng Pastel")).toBeInTheDocument();
  });

  it("renders size chips with disabled-state label for out-of-stock size", () => {
    renderWithIntl(
      <ProductVariantSelectors
        colors={COLORS}
        sizes={SIZES}
        selectedColor="Trắng Tinh Khôi"
        selectedSize="M"
        onColorChange={() => {}}
        onSizeChange={() => {}}
      />
    );
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("XL")).toBeInTheDocument();
    // Out-of-stock label appears only for disabled size
    const outOfStockLabels = screen.getAllByText("(Hết hàng)");
    expect(outOfStockLabels).toHaveLength(1);
  });

  it("emits onColorChange when a color chip is clicked", async () => {
    const user = userEvent.setup();
    const onColorChange = vi.fn();
    renderWithIntl(
      <ProductVariantSelectors
        colors={COLORS}
        sizes={SIZES}
        selectedColor="Trắng Tinh Khôi"
        selectedSize="M"
        onColorChange={onColorChange}
        onSizeChange={() => {}}
      />
    );
    await user.click(screen.getByRole("button", { name: /Đen Huyền Bí/ }));
    expect(onColorChange).toHaveBeenCalledWith("Đen Huyền Bí");
  });

  it("emits onSizeChange when a non-disabled size chip is clicked", async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    renderWithIntl(
      <ProductVariantSelectors
        colors={COLORS}
        sizes={SIZES}
        selectedColor="Trắng Tinh Khôi"
        selectedSize="M"
        onColorChange={() => {}}
        onSizeChange={onSizeChange}
      />
    );
    await user.click(screen.getByRole("button", { name: "L" }));
    expect(onSizeChange).toHaveBeenCalledWith("L");
  });

  it("does NOT emit onSizeChange when a disabled size chip is clicked", async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    renderWithIntl(
      <ProductVariantSelectors
        colors={COLORS}
        sizes={SIZES}
        selectedColor="Trắng Tinh Khôi"
        selectedSize="M"
        onColorChange={() => {}}
        onSizeChange={onSizeChange}
      />
    );
    // Find the disabled XL button and try clicking it; it must not fire
    const xlBtn = screen.getByRole("button", { name: /XL/ });
    expect(xlBtn).toBeDisabled();
    // userEvent will not dispatch click on disabled buttons by default
    await user.click(xlBtn).catch(() => {});
    expect(onSizeChange).not.toHaveBeenCalled();
  });

  it("applies active outline styling to the selected color chip", () => {
    renderWithIntl(
      <ProductVariantSelectors
        colors={COLORS}
        sizes={SIZES}
        selectedColor="Trắng Tinh Khôi"
        selectedSize="M"
        onColorChange={() => {}}
        onSizeChange={() => {}}
      />
    );
    const activeColorBtn = screen.getByRole("button", {
      name: /Trắng Tinh Khôi/,
    });
    // Active: outline-primary + bg-surface-container-lowest
    expect(activeColorBtn.className).toMatch(/outline-primary/);
    expect(activeColorBtn.className).toMatch(/bg-surface-container-lowest/);
  });

  it("applies active outline styling to the selected size chip", () => {
    renderWithIntl(
      <ProductVariantSelectors
        colors={COLORS}
        sizes={SIZES}
        selectedColor="Trắng Tinh Khôi"
        selectedSize="M"
        onColorChange={() => {}}
        onSizeChange={() => {}}
      />
    );
    const activeSizeBtn = screen.getByRole("button", { name: "M" });
    expect(activeSizeBtn.className).toMatch(/outline-primary/);
    expect(activeSizeBtn.className).toMatch(/bg-surface-container-lowest/);
  });

  it("renders the Vietnamese size guide link below size chips", () => {
    renderWithIntl(
      <ProductVariantSelectors
        colors={COLORS}
        sizes={SIZES}
        selectedColor="Trắng Tinh Khôi"
        selectedSize="M"
        onColorChange={() => {}}
        onSizeChange={() => {}}
      />
    );
    expect(
      screen.getByText("Bảng quy đổi kích thước chuẩn người Việt")
    ).toBeInTheDocument();
  });
});
