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

describe("ProductVariantSelectors – defensive guards (BE nullable)", () => {
  const COLORS = [
    { name: "Trắng Tinh Khôi", bgClass: "bg-slate-100" },
    { name: "Đen Huyền Bí", bgClass: "bg-slate-900" },
  ];
  const SIZES = [
    { label: "S" },
    { label: "M" },
    { label: "L" },
    { label: "XL", disabled: true },
  ];

  it("does NOT crash when colors is undefined (BE missing)", () => {
    expect(() =>
      renderWithIntl(
        <ProductVariantSelectors
          colors={undefined as unknown as Array<{ name: string; bgClass: string }>}
          sizes={SIZES}
          onColorChange={() => {}}
          onSizeChange={() => {}}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when sizes is undefined (BE missing)", () => {
    expect(() =>
      renderWithIntl(
        <ProductVariantSelectors
          colors={COLORS}
          sizes={undefined as unknown as Array<{ label: string; disabled?: boolean }>}
          onColorChange={() => {}}
          onSizeChange={() => {}}
        />,
      ),
    ).not.toThrow();
  });

  it("does NOT crash when both colors and sizes are null (BE explicit null)", () => {
    expect(() =>
      renderWithIntl(
        <ProductVariantSelectors
          colors={null as unknown as Array<{ name: string; bgClass: string }>}
          sizes={null as unknown as Array<{ label: string; disabled?: boolean }>}
          onColorChange={() => {}}
          onSizeChange={() => {}}
        />,
      ),
    ).not.toThrow();
  });
});

describe("ProductVariantSelectors – dynamic tiers from tierVariationConfigs", () => {
  const dynamicTiers = [
    {
      name: "Color",
      options: [
        { label: "Black", bgClass: "bg-slate-900" },
        { label: "White", bgClass: "bg-slate-100" },
      ],
    },
    {
      name: "Dung lượng",
      options: [
        { label: "128GB" },
        { label: "256GB" },
        { label: "512GB", disabled: true },
      ],
    },
  ];

  it("renders exactly the number of options defined in tiers (not extra)", () => {
    renderWithIntl(
      <ProductVariantSelectors
        tiers={dynamicTiers}
        selectedOptions={{ Color: "Black", "Dung lượng": "128GB" }}
        onSelectOption={() => {}}
      />,
    );

    // Color tier has name "Color" rendered verbatim as "Color:" (not translated)
    expect(screen.getByText("Color:")).toBeInTheDocument();
    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();

    // Dung lượng tier has custom name and 3 options
    expect(screen.getByText("Dung lượng:")).toBeInTheDocument();
    expect(screen.getByText("128GB")).toBeInTheDocument();
    expect(screen.getByText("256GB")).toBeInTheDocument();
    expect(screen.getByText("512GB")).toBeInTheDocument();

    // 512GB is disabled
    expect(screen.getByRole("button", { name: /512GB/ })).toBeDisabled();
  });

  it("fires onSelectOption when clicking an active option", async () => {
    const user = userEvent.setup();
    const onSelectOption = vi.fn();

    renderWithIntl(
      <ProductVariantSelectors
        tiers={dynamicTiers}
        selectedOptions={{ Color: "Black", "Dung lượng": "128GB" }}
        onSelectOption={onSelectOption}
      />,
    );

    await user.click(screen.getByRole("button", { name: /White/ }));
    expect(onSelectOption).toHaveBeenCalledWith("Color", "White");

    await user.click(screen.getByRole("button", { name: "256GB" }));
    expect(onSelectOption).toHaveBeenCalledWith("Dung lượng", "256GB");
  });
});

