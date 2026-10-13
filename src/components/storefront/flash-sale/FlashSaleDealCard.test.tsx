/**
 * Smoke test cho FlashSaleDealCard – 3 variants: default, almost-sold-out, sold-out.
 *
 * Test logic:
 * - Render 3 variants với 1 item mock mỗi cái
 * - Kiểm tra: badge "FLASH SALE", badge "-%", price, sold count
 * - Variant 'sold-out': hiển thị "Đã hết" + button disabled
 * - Variant 'almost-sold-out': hiển thị "SẮP CHÁY HÀNG" + "Chỉ còn X suất"
 * - Variant 'default': chỉ hiển thị "ĐÃ BÁN X" + "Giới hạn N sản phẩm/khách"
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashSaleDealCard } from "./FlashSaleDealCard";
import type { PublicFlashSaleItemResponse } from "@/features/flash-sale";

// next/image trong jsdom: trả <img> đơn giản, không cần mock.
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function mkItem(overrides: Partial<PublicFlashSaleItemResponse> = {}): PublicFlashSaleItemResponse {
  return {
    id: 1,
    slotId: 101,
    variantId: 10,
    sku: "MOCK-0001",
    variantName: "Default",
    productName: "Tai nghe Bluetooth ANC AirPro không dây",
    imageUrl: "https://picsum.photos/seed/x/600/600",
    originalPrice: 1_450_000,
    flashSalePrice: 790_000,
    allocatedStock: 100,
    availableStock: 28,
    userPurchaseLimit: 2,
    status: "APPROVED",
    ...overrides,
  };
}

function withProviders(ui: React.ReactNode) {
  return render(ui);
}

describe("FlashSaleDealCard – default variant", () => {
  it("renders product name, price, and original price (strikethrough)", () => {
    withProviders(<FlashSaleDealCard item={mkItem()} />);
    expect(screen.getByText(/tai nghe bluetooth anc airpro/i)).toBeInTheDocument();
    // formatVND từ lib/format
    expect(screen.getByText(/790\.000₫/)).toBeInTheDocument();
    expect(screen.getByText(/1\.450\.000₫/)).toBeInTheDocument();
  });

  it("renders discount badge (e.g. -46%)", () => {
    // originalPrice=1_450_000, flashSalePrice=790_000 → (660k/1450k)*100 ≈ 45.5% → round 46%
    withProviders(<FlashSaleDealCard item={mkItem()} />);
    expect(screen.getByText(/-46%/)).toBeInTheDocument();
  });

  it("renders stock bar text 'ĐÃ BÁN X' and limit text", () => {
    withProviders(<FlashSaleDealCard item={mkItem({ availableStock: 28, allocatedStock: 100 })} />);
    expect(screen.getByText(/ĐÃ BÁN 72/i)).toBeInTheDocument();
    expect(screen.getByText(/Giới hạn 2 sản phẩm\/khách/i)).toBeInTheDocument();
  });

  it("renders 'Mua ngay' button linking to product detail", () => {
    withProviders(<FlashSaleDealCard item={mkItem({ id: 42 })} />);
    const link = screen.getByRole("link", { name: /mua ngay/i });
    expect(link).toHaveAttribute("href", "/products/42");
  });
});

describe("FlashSaleDealCard – almost-sold-out variant", () => {
  it("renders 'SẮP CHÁY HÀNG' label and warning 'Chỉ còn X suất'", () => {
    withProviders(
      <FlashSaleDealCard
        item={mkItem({ allocatedStock: 200, availableStock: 16 })}
      />,
    );
    expect(screen.getByText(/SẮP CHÁY HÀNG/i)).toBeInTheDocument();
    // 200 - 16 = 184 đã bán
    expect(screen.getByText(/184\/200/i)).toBeInTheDocument();
    // Còn 16 → 200 - 184 = 16 suất còn lại
    expect(screen.getByText(/Chỉ còn lại 16 suất/i)).toBeInTheDocument();
  });
});

describe("FlashSaleDealCard – sold-out variant", () => {
  it("renders 'HẾT HÀNG' overlay and disabled 'Đã hết' button", () => {
    withProviders(
      <FlashSaleDealCard
        item={mkItem({ allocatedStock: 100, availableStock: 0 })}
      />,
    );
    expect(screen.getByText(/HẾT HÀNG/i)).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /đã hết/i });
    expect(btn).toBeDisabled();
  });

  it("sold-out card has reduced opacity (visual signal)", () => {
    const { container } = withProviders(
      <FlashSaleDealCard
        item={mkItem({ allocatedStock: 100, availableStock: 0 })}
      />,
    );
    // Card root có class opacity-85 hoặc tương đương
    const card = container.querySelector('[data-testid="flash-sale-deal-card"]');
    expect(card?.className).toMatch(/opacity-/);
  });
});
