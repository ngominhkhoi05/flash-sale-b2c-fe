/**
 * ProductCtaButtons – Section 14.
 * Tests: standard 2-button mode, flash single-button mode, click handlers.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCtaButtons } from "./ProductCtaButtons";
import { TestWrapper } from "@/__tests__/test-wrapper";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductCtaButtons – standard mode", () => {
  it("renders two CTA buttons (Add to Cart + Buy Now)", () => {
    renderWithIntl(
      <ProductCtaButtons
        mode="standard"
        onAddToCart={() => {}}
        onBuyNow={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mua Ngay/ })).toBeInTheDocument();
  });

  it("calls onAddToCart when Add-to-Cart button is clicked", async () => {
    const user = userEvent.setup();
    const onAddToCart = vi.fn();
    renderWithIntl(
      <ProductCtaButtons
        mode="standard"
        onAddToCart={onAddToCart}
        onBuyNow={() => {}}
      />
    );
    await user.click(screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ }));
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it("calls onBuyNow when Buy Now button is clicked", async () => {
    const user = userEvent.setup();
    const onBuyNow = vi.fn();
    renderWithIntl(
      <ProductCtaButtons
        mode="standard"
        onAddToCart={() => {}}
        onBuyNow={onBuyNow}
      />
    );
    await user.click(screen.getByRole("button", { name: /Mua Ngay/ }));
    expect(onBuyNow).toHaveBeenCalledTimes(1);
  });
});

describe("ProductCtaButtons – flash mode", () => {
  it("renders a single full-width flash CTA with hold-for-5-min text", () => {
    renderWithIntl(
      <ProductCtaButtons
        mode="flash"
        onBuyNow={() => {}}
      />
    );
    expect(
      screen.getByRole("button", { name: /Mua ngay.*Giữ hàng 5 phút/ })
    ).toBeInTheDocument();
    // Single CTA only — Add-to-Cart must not appear in flash mode
    expect(
      screen.queryByRole("button", { name: /Thêm Vào Giỏ Hàng/ })
    ).not.toBeInTheDocument();
  });

  it("calls onBuyNow when flash CTA is clicked", async () => {
    const user = userEvent.setup();
    const onBuyNow = vi.fn();
    renderWithIntl(
      <ProductCtaButtons
        mode="flash"
        onBuyNow={onBuyNow}
      />
    );
    await user.click(
      screen.getByRole("button", { name: /Mua ngay.*Giữ hàng 5 phút/ })
    );
    expect(onBuyNow).toHaveBeenCalledTimes(1);
  });
});
