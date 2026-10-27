/**
 * ProductCtaButtons - Section 14.
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

describe("ProductCtaButtons - standard mode", () => {
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

describe("ProductCtaButtons - flash mode", () => {
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

// Defensive disabled tests (Subplan B 2026-10-18: hide-cta + outOfStock)
describe("ProductCtaButtons - disabledReason='contact' (no price)", () => {
  it("disables Add-to-Cart button with title tooltip when disabledReason='contact'", () => {
    renderWithIntl(
      <ProductCtaButtons
        mode="standard"
        disabledReason="contact"
        onAddToCart={() => {}}
        onBuyNow={() => {}}
      />
    );
    const addBtn = screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ });
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveAttribute("aria-disabled", "true");
    expect(addBtn).toHaveAttribute("title", "Vui lòng liên hệ shop để biết giá và đặt hàng");
  });

  it("disables Buy-Now button when disabledReason='contact'", () => {
    renderWithIntl(
      <ProductCtaButtons
        mode="standard"
        disabledReason="contact"
        onAddToCart={() => {}}
        onBuyNow={() => {}}
      />
    );
    const buyBtn = screen.getByRole("button", { name: /Mua Ngay/ });
    expect(buyBtn).toBeDisabled();
    expect(buyBtn).toHaveAttribute("aria-disabled", "true");
  });

  it("disables flash CTA when disabledReason='contact'", () => {
    renderWithIntl(
      <ProductCtaButtons
        mode="flash"
        disabledReason="contact"
        onBuyNow={() => {}}
      />
    );
    const flashBtn = screen.getByRole("button", { name: /Mua ngay.*Giữ hàng 5 phút/ });
    expect(flashBtn).toBeDisabled();
    expect(flashBtn).toHaveAttribute("title", "Vui lòng liên hệ shop để biết giá và đặt hàng");
  });

  it("disables CTA with outOfStock tooltip when disabledReason='outOfStock'", () => {
    renderWithIntl(
      <ProductCtaButtons
        mode="standard"
        disabledReason="outOfStock"
        onAddToCart={() => {}}
        onBuyNow={() => {}}
      />
    );
    const addBtn = screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ });
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveAttribute("title", "Sản phẩm hiện đã hết hàng");
  });
});

describe("ProductCtaButtons - independent loading states", () => {
  it("shows spinner ONLY on Add-to-Cart button when isAddingToCart is true", () => {
    const { container } = renderWithIntl(
      <ProductCtaButtons
        mode="standard"
        isAddingToCart={true}
        isBuyingNow={false}
        onAddToCart={() => {}}
        onBuyNow={() => {}}
      />
    );
    const addBtn = screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ });
    const buyBtn = screen.getByRole("button", { name: /Mua Ngay/ });

    // Cả 2 nút đều bị disabled để tránh double-click
    expect(addBtn).toBeDisabled();
    expect(buyBtn).toBeDisabled();

    // Chỉ có Add to Cart có spinner
    expect(addBtn.querySelector(".animate-spin")).toBeInTheDocument();
    expect(buyBtn.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("shows spinner ONLY on Buy Now button when isBuyingNow is true", () => {
    renderWithIntl(
      <ProductCtaButtons
        mode="standard"
        isAddingToCart={false}
        isBuyingNow={true}
        onAddToCart={() => {}}
        onBuyNow={() => {}}
      />
    );
    const addBtn = screen.getByRole("button", { name: /Thêm Vào Giỏ Hàng/ });
    const buyBtn = screen.getByRole("button", { name: /Mua Ngay/ });

    expect(addBtn).toBeDisabled();
    expect(buyBtn).toBeDisabled();

    // Chỉ có Buy Now có spinner
    expect(addBtn.querySelector(".animate-spin")).not.toBeInTheDocument();
    expect(buyBtn.querySelector(".animate-spin")).toBeInTheDocument();
  });
});

