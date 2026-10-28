import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashSaleItemDetailPage } from "./FlashSaleItemDetailPage";
import type { PublicFlashSaleItemDetailResponse } from "@/features/flash-sale";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock hooks
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, email: "buyer@example.com" },
  }),
}));

vi.mock("@/features/flash-sale", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    reserveFlashSale: vi.fn().mockResolvedValue({
      orderId: 99,
      orderCode: "FS-123456",
      flashSaleItemId: 1,
      quantity: 1,
      flashSalePrice: 750000,
      totalAmount: 750000,
      status: "PENDING_PAYMENT",
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      message: "Đặt giữ chỗ Flash Sale thành công!",
    }),
  };
});

describe("FlashSaleItemDetailPage", () => {
  const mockItem: PublicFlashSaleItemDetailResponse = {
    id: 1,
    slotId: 101,
    slotTitle: "Flash Sale Giờ Vàng",
    slotStartTime: new Date(Date.now() - 3600000).toISOString(),
    slotEndTime: new Date(Date.now() + 3600000).toISOString(),
    slotStatus: "ACTIVE",
    reservationTtlSeconds: 300,
    originalPrice: 1500000,
    flashSalePrice: 750000,
    discountPercent: 50,
    allocatedStock: 100,
    availableStock: 25,
    userPurchaseLimit: 2,
    status: "APPROVED",
    productId: 5,
    productName: "Áo Thun Thể Thao Nam Cao Cấp",
    productDescription: "Chất vải thun lạnh thoáng khí",
    productSlug: "ao-thun-the-thao-nam",
    totalSold: 250,
    ratingAvg: 4.8,
    ratingCount: 45,
    categoryId: 2,
    categoryName: "Thời trang nam",
    storeId: 10,
    storeName: "Sportswear Official",
    storeTier: "OFFICIAL_MALL",
    variantId: 16,
    sku: "SKU-AO-S-GREEN",
    variantName: "Size S - Green",
    attributes: {
      "Kích cỡ": "Size S",
      "Màu sắc": "Xanh lá (Green)",
    },
    primaryImageUrl: "https://example.com/item1.jpg",
    imageUrls: ["https://example.com/item1.jpg", "https://example.com/item1-back.jpg"],
  };

  it("renders product name, price, and fixed variant info correctly", () => {
    render(<FlashSaleItemDetailPage item={mockItem} />);

    // Tên sản phẩm
    expect(screen.getByRole("heading", { level: 1, name: /Áo Thun Thể Thao Nam Cao Cấp/i })).toBeInTheDocument();

    // Giá flash sale và giá gốc
    expect(screen.getAllByText(/750\.000₫/)[0]).toBeInTheDocument();
    expect(screen.getByText(/1\.500\.000₫/)).toBeInTheDocument();

    // Biến thể cố định: Size S - Green và SKU
    expect(screen.getAllByText("Size S - Green")[0]).toBeInTheDocument();
    expect(screen.getByText("SKU-AO-S-GREEN")).toBeInTheDocument();
    expect(screen.getByText("Kích cỡ:")).toBeInTheDocument();
    expect(screen.getByText("Size S")).toBeInTheDocument();
    expect(screen.getByText("Màu sắc:")).toBeInTheDocument();
    expect(screen.getByText("Xanh lá (Green)")).toBeInTheDocument();
  });

  it("displays flash sale remaining stock and purchase limit", () => {
    render(<FlashSaleItemDetailPage item={mockItem} />);

    // Hiển thị số lượng còn trong phiên flash sale
    expect(screen.getByText(/Còn lại 25 \/ 100 suất trong phiên/i)).toBeInTheDocument();
    expect(screen.getByText(/Giới hạn mua:/i)).toBeInTheDocument();
    expect(screen.getByText(/Tối đa 2 sản phẩm/i)).toBeInTheDocument();
  });

  it("has NO variant selectors or dropdowns to switch to other variants", () => {
    render(<FlashSaleItemDetailPage item={mockItem} />);

    // Kiểm tra không có select dropdown nào
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    // Kiểm tra không có radio group để chọn size khác
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();

    // Hiển thị thông báo cố định phân loại độc quyền
    expect(
      screen.getByText(/Trang này không hỗ trợ đổi sang phân loại hoặc kích cỡ khác/i)
    ).toBeInTheDocument();
  });

  it("renders ONLY 'Mua ngay' button and NO 'Thêm vào giỏ hàng' button", () => {
    render(<FlashSaleItemDetailPage item={mockItem} />);

    // KHÔNG CÓ nút thêm vào giỏ hàng
    expect(screen.queryByRole("button", { name: /Thêm vào giỏ hàng/i })).not.toBeInTheDocument();

    // CHỈ CÓ duy nhất nút Mua ngay
    expect(screen.getByRole("button", { name: /MUA NGAY VỚI GIÁ FLASH SALE/i })).toBeInTheDocument();
  });

  it("calls reserveFlashSale when clicking Buy Now button", async () => {
    const { reserveFlashSale } = await import("@/features/flash-sale");
    render(<FlashSaleItemDetailPage item={mockItem} />);

    const buyButton = screen.getByRole("button", { name: /MUA NGAY VỚI GIÁ FLASH SALE/i });
    buyButton.click();

    expect(reserveFlashSale).toHaveBeenCalledWith(
      expect.objectContaining({
        flashSaleItemId: 1,
        quantity: 1,
      }),
      expect.any(String)
    );
  });
});
