import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductPricingBox } from "./ProductPricingBox";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { FlashSaleInfo } from "@/features/products";

// Fix: jsdom Date.now() can be unreliable for Countdown
const FLASH: FlashSaleInfo = {
  flashSaleItemId: 1,
  variantId: 1,
  price: 89000,
  originalPrice: 159000,
  discountPercent: 44,
  totalStock: 100,
  soldStock: 72,
  maxQtyPerUser: 2,
  endsAt: "2099-12-31T23:59:59Z", // future
};

function renderWithIntl(ui: React.ReactElement) {
  return render(<TestWrapper>{ui}</TestWrapper>);
}

describe("ProductPricingBox – standard variant", () => {
  it("renders min price in VND format", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="standard"
        minPrice={89000}
        maxPrice={159000}
      />
    );
    expect(screen.getByTestId("standard-price")).toHaveTextContent("89.000₫");
  });

  it("renders price range when min < max", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="standard"
        minPrice={89000}
        maxPrice={159000}
      />
    );
    expect(screen.getByText(/159.000₫/)).toBeInTheDocument();
  });

  it("does NOT render price range when min == max", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="standard"
        minPrice={89000}
        maxPrice={89000}
      />
    );
    // No en-dash between two same values
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });
});

describe("ProductPricingBox – flash variant", () => {
  it("renders flash banner when flashSale provided", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        maxPrice={159000}
        flashSale={FLASH}
      />
    );
    expect(screen.getByTestId("pricing-box-flash")).toBeInTheDocument();
    expect(screen.getByText(/FLASH SALE/)).toBeInTheDocument();
  });

  it("renders flash price + discount percent", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        maxPrice={159000}
        flashSale={FLASH}
      />
    );
    const priceEl = screen.getByTestId("flash-price");
    expect(priceEl).toHaveTextContent("89.000₫");
    expect(screen.getByText(/-44%/)).toBeInTheDocument();
  });

  it("renders stock progress bar with correct width", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        maxPrice={159000}
        flashSale={FLASH}
      />
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "72"); // 72/100
  });

  it("renders max qty note", () => {
    renderWithIntl(
      <ProductPricingBox
        variant="flash"
        minPrice={89000}
        maxPrice={159000}
        flashSale={FLASH}
      />
    );
    expect(screen.getByText(/tối đa 2/)).toBeInTheDocument();
  });
});
