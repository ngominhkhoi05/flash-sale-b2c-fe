import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductPricingBox } from "./ProductPricingBox";
import { TestWrapper } from "@/__tests__/test-wrapper";

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

const FLASH = {
  endsAt: "2099-12-31T23:59:59Z", // future
  soldStock: 72,
  totalStock: 100,
  maxQtyPerUser: 2,
};

describe("ProductPricingBox – standard variant", () => {
  it("renders the main price in VND format with primary color", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="standard"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
      />
    );
    const priceEl = screen.getByTestId("standard-price");
    expect(priceEl).toHaveTextContent("89.000₫");
    expect(priceEl).toHaveClass("text-primary");
  });

  it("renders original price with line-through", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="standard"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
      />
    );
    const old = screen.getByTestId("standard-original");
    expect(old).toHaveTextContent("159.000₫");
    expect(old).toHaveClass("line-through");
  });

  it("renders discount percent badge", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="standard"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
      />
    );
    expect(screen.getByText(/-44%/)).toBeInTheDocument();
  });

  it("does NOT render flash banner in standard mode", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="standard"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
      />
    );
    expect(screen.queryByTestId("flash-banner")).not.toBeInTheDocument();
  });

  it("does NOT render progress bar in standard mode", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="standard"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
      />
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  // ── Defensive null tests (2026-10-18 bug #2 fix) ───────────────────────
  it("renders 'Liên hệ' contact text when minPrice is null", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="standard"
        minPrice={null}
        originalPrice={null}
        discountPercent={0}
      />,
    );
    // 'Liên hệ để biết giá' (i18n key contactForPrice)
    expect(screen.getByTestId("standard-price-contact")).toHaveTextContent(/Liên hệ/);
    // Số tiền 0₫ KHÔNG render.
    expect(screen.queryByTestId("standard-price")).not.toBeInTheDocument();
    expect(screen.queryByTestId("standard-original")).not.toBeInTheDocument();
  });

  it("renders 'Liên hệ' contact text when minPrice is null in FLASH mode", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={null}
        originalPrice={null}
        discountPercent={0}
        flashSale={FLASH}
      />,
    );
    expect(screen.getByTestId("flash-price-contact")).toHaveTextContent(/Liên hệ/);
    expect(screen.queryByTestId("flash-price")).not.toBeInTheDocument();
  });
});

describe("ProductPricingBox – flash variant", () => {
  it("renders flash banner with title and countdown", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
        flashSale={FLASH}
      />
    );
    const banner = screen.getByTestId("flash-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/FLASH SALE GIỜ VÀNG/);
    // Countdown text "Kết thúc sau" should be inside banner
    expect(banner).toHaveTextContent(/Kết thúc sau/);
  });

  it("renders flash price with tertiary color + FLASH DEAL badge", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
        flashSale={FLASH}
      />
    );
    const priceEl = screen.getByTestId("flash-price");
    expect(priceEl).toHaveTextContent("89.000₫");
    expect(priceEl).toHaveClass("text-tertiary");
    // FLASH DEAL CHỈ CÒN 28 SUẤT
    expect(screen.getByText(/FLASH DEAL CHỈ CÒN 28 SUẤT/)).toBeInTheDocument();
  });

  it("Countdown receives endsAt prop (renders MM:SS like 59:59)", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
        flashSale={FLASH}
      />
    );
    // Countdown long variant shows "ngày HH:MM:SS"
    // Just verify the banner contains the timer digit blocks
    const banner = screen.getByTestId("flash-banner");
    expect(banner.textContent).toMatch(/\d{2}/);
  });

  it("renders stock progress bar with aria-valuenow = sold/total %", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
        flashSale={FLASH}
      />
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "72"); // 72/100 = 72%
    // Inner fill width should be 72%
    const fill = bar.querySelector("div");
    expect(fill).toHaveStyle({ width: "72%" });
  });

  it("renders sold/total text and remaining count", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
        flashSale={FLASH}
      />
    );
    expect(screen.getByText(/Đã bán 72\/100/)).toBeInTheDocument();
    expect(screen.getByText(/Còn lại 28 suất/)).toBeInTheDocument();
  });

  it("renders max qty note from flashSale.maxQtyPerUser", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        originalPrice={159000}
        discountPercent={44}
        flashSale={FLASH}
      />
    );
    expect(
      screen.getByText(/Mỗi khách hàng chỉ được mua tối đa 2 sản phẩm/)
    ).toBeInTheDocument();
  });
});
