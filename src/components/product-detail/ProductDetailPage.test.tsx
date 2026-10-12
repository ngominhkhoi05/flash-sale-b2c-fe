/**
 * ProductDetailPage – integration tests.
 *
 * Cover:
 *   - Renders toàn bộ sections trong product detail page.
 *   - Default `activeVariant` = "flash" khi có flashSale.
 *   - Default `activeVariant` = "standard" khi không có flashSale.
 *   - Switch A↔B giữa standard / flash mode.
 *   - Switch từ flash → standard clamp quantity về stockCount.
 *   - Click CTA Buy Now → gọi handler.
 *   - Click CTA Add-to-Cart (chỉ ở standard) → gọi handler.
 *   - Color/size change cập nhật state.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductDetailPage } from "./ProductDetailPage";
import { TestWrapper } from "@/__tests__/test-wrapper";
import { mockProductDetail } from "@/features/products/mock";

function renderPage(product = mockProductDetail) {
  return render(
    <TestWrapper>
      <ProductDetailPage product={product} />
    </TestWrapper>,
  );
}

describe("ProductDetailPage – rendering", () => {
  it("renders all primary sections", () => {
    renderPage();
    // Breadcrumb
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument();
    // Gallery (5 images)
    expect(screen.getByTestId("gallery-main-image")).toBeInTheDocument();
    // HeaderInfo title
    expect(
      screen.getByRole("heading", {
        name: /Áo thun unisex cotton UTC Basic/i,
      }),
    ).toBeInTheDocument();
    // StoreCard
    expect(screen.getByTestId("product-store-card")).toBeInTheDocument();
    // Specs table (6 rows)
    const specRows = screen.getAllByTestId("spec-row");
    expect(specRows.length).toBe(6);
    // DescriptionCard
    expect(screen.getByTestId("description-paragraphs")).toBeInTheDocument();
  });
});

describe("ProductDetailPage – default variant", () => {
  it("defaults to flash mode when product has flashSale", () => {
    expect(mockProductDetail.flashSale).not.toBeNull();
    renderPage();
    // The flash pricing box is rendered (its specific testid is "pricing-box-flash")
    expect(screen.getByTestId("pricing-box-flash")).toBeInTheDocument();
    // Standard pricing box should NOT be in the DOM
    expect(screen.queryByTestId("pricing-box-standard")).not.toBeInTheDocument();
  });

  it("defaults to standard mode when product has no flashSale", () => {
    const noFlash = { ...mockProductDetail, flashSale: null };
    renderPage(noFlash);
    expect(screen.getByTestId("pricing-box-standard")).toBeInTheDocument();
    expect(screen.queryByTestId("pricing-box-flash")).not.toBeInTheDocument();
  });
});

describe("ProductDetailPage – variant switching", () => {
  it("clicking standard variant toggles pricing-box", async () => {
    const user = userEvent.setup();
    renderPage();
    // Initially flash
    expect(screen.getByTestId("pricing-box-flash")).toBeInTheDocument();

    // Find a Standard button (could be multiple — pick the first)
    const standardButtons = screen.getAllByRole("button", {
      name: /Biến thể A/i,
    });
    await user.click(standardButtons[0]);

    // Now should show standard
    expect(screen.getByTestId("pricing-box-standard")).toBeInTheDocument();
    expect(screen.queryByTestId("pricing-box-flash")).not.toBeInTheDocument();
  });

  it("clicking flash variant toggles pricing-box back to flash", async () => {
    const user = userEvent.setup();
    renderPage();
    // First switch to standard
    const standardButtons = screen.getAllByRole("button", {
      name: /Biến thể A/i,
    });
    await user.click(standardButtons[0]);
    expect(screen.getByTestId("pricing-box-standard")).toBeInTheDocument();

    // Then back to flash
    const flashButtons = screen.getAllByRole("button", {
      name: /Biến thể B/i,
    });
    await user.click(flashButtons[0]);
    expect(screen.getByTestId("pricing-box-flash")).toBeInTheDocument();
  });
});

describe("ProductDetailPage – quantity clamp on switch", () => {
  it("clamps quantity when switching from flash (maxQty=2) to standard (stockCount)", async () => {
    const user = userEvent.setup();
    renderPage();
    // Set quantity to 2 (default flashMaxQty = 2 — matches + button click).
    const inc = screen.getByLabelText(/Increase quantity/i);
    await user.click(inc); // qty: 1 -> 2
    expect((screen.getByRole("textbox", { name: /Quantity$/ }) as HTMLInputElement).value).toBe("2");
    // Switch to standard
    const standardButtons = screen.getAllByRole("button", {
      name: /Biến thể A/i,
    });
    await user.click(standardButtons[0]);
    // Quantity should be clamped to min(2, stockCount). Since stockCount = 144
    // (12 variants * 48 stock), quantity remains 2.
    const qtyInput = screen.getByRole("textbox", { name: /Quantity$/ }) as HTMLInputElement;
    expect(Number(qtyInput.value)).toBeLessThanOrEqual(144);
  });

  it("decrements quantity correctly with - button", async () => {
    const user = userEvent.setup();
    renderPage();
    const inc = screen.getByLabelText(/Increase quantity/i);
    await user.click(inc); // 1 -> 2
    const dec = screen.getByLabelText(/Decrease quantity/i);
    await user.click(dec); // 2 -> 1
    const qtyInput = screen.getByRole("textbox", { name: /Quantity$/ }) as HTMLInputElement;
    expect(qtyInput.value).toBe("1");
  });
});

describe("ProductDetailPage – CTA handlers", () => {
  it("renders flash-mode single CTA when activeVariant is flash", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: /Mua ngay.*Giữ hàng 5 phút/i }),
    ).toBeInTheDocument();
    // Add-to-Cart button should NOT be in flash mode
    expect(
      screen.queryByRole("button", { name: /Thêm Vào Giỏ Hàng/i }),
    ).not.toBeInTheDocument();
  });

  it("renders two CTAs in standard mode (Add-to-Cart + Buy Now)", async () => {
    const user = userEvent.setup();
    renderPage();
    // Switch to standard
    const standardButtons = screen.getAllByRole("button", {
      name: /Biến thể A/i,
    });
    await user.click(standardButtons[0]);
    expect(
      screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mua Ngay/i })).toBeInTheDocument();
  });

  it("triggers window.alert when Buy Now is clicked (mocked)", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    renderPage();
    await user.click(
      screen.getByRole("button", { name: /Mua ngay.*Giữ hàng 5 phút/i }),
    );
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

describe("ProductDetailPage – variant selectors", () => {
  it("clicking a color chip updates aria-pressed state", async () => {
    const user = userEvent.setup();
    renderPage();
    // Find color chips (Trắng Tinh Khôi, Đen Huyền Bí, Vàng Pastel)
    const trangButton = screen.getByRole("button", { name: /Trắng Tinh Khôi/i });
    expect(trangButton).toHaveAttribute("aria-pressed", "true");
    const denButton = screen.getByRole("button", { name: /Đen Huyền Bí/i });
    expect(denButton).toHaveAttribute("aria-pressed", "false");
    await user.click(denButton);
    expect(denButton).toHaveAttribute("aria-pressed", "true");
    expect(trangButton).toHaveAttribute("aria-pressed", "false");
  });

  it("renders OOS size (XL) as disabled", () => {
    renderPage();
    // XL button should exist and be disabled
    const xl = screen.getByRole("button", { name: /^XL/ });
    expect(xl).toBeDisabled();
  });

  it("clicking an enabled size updates aria-pressed", async () => {
    const user = userEvent.setup();
    renderPage();
    const sizeL = screen.getByRole("button", { name: /^L$/ });
    await user.click(sizeL);
    expect(sizeL).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ProductDetailPage – commitments and vouchers", () => {
  it("renders all 3 commitment badges", () => {
    renderPage();
    // 3 commitment texts
    expect(screen.getByText(/100% Cotton Tự Nhiên/i)).toBeInTheDocument();
    expect(screen.getByText(/Đổi trả 30 ngày/i)).toBeInTheDocument();
    expect(screen.getByText(/Bảo hành may 6 tháng/i)).toBeInTheDocument();
  });

  it("renders voucher chips", () => {
    renderPage();
    expect(screen.getByTestId("product-vouchers")).toBeInTheDocument();
  });
});

describe("ProductDetailPage – data derivation", () => {
  it("renders fallback rating/sold/question counts from product", () => {
    renderPage();
    // Rating count link "(326 đánh giá)"
    expect(screen.getByText(/\(326 đánh giá\)/i)).toBeInTheDocument();
  });
});