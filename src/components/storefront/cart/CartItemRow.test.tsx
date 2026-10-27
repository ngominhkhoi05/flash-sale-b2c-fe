/**
 * Unit tests cho CartItemRow.
 * Kiểm tra:
 * - Nút giảm hiển thị icon "remove" (dấu -) thay vì "close" (dấu x)
 * - Nút tăng hiển thị icon "add" (dấu +)
 * - Nút giảm bị disabled khi quantity <= 1 hoặc isLoading
 * - Click nút giảm gọi onDecrement
 * - Click nút tăng gọi onIncrement
 * - Click nút xoá gọi onRemove
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartItemRow } from "./CartItemRow";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { BackendCartItem } from "@/features/cart";

const MOCK_ITEM: BackendCartItem = {
  id: 101,
  variantId: 201,
  sku: "SKU-001",
  storeId: 10,
  storeName: "Test Store",
  productName: "Áo Thun Unisex",
  variantName: "Đen / L",
  imageUrl: "https://example.com/item.jpg",
  price: 200000,
  quantity: 2,
  itemSubtotal: 400000,
};

function renderRow(props: Partial<React.ComponentProps<typeof CartItemRow>> = {}) {
  const onIncrement = vi.fn();
  const onDecrement = vi.fn();
  const onRemove = vi.fn();

  render(
    <TestWrapper>
      <CartItemRow
        item={MOCK_ITEM}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
        {...props}
      />
    </TestWrapper>,
  );

  return { onIncrement, onDecrement, onRemove };
}

describe("CartItemRow", () => {
  it("hiển thị thông tin sản phẩm và số lượng", () => {
    renderRow();
    expect(screen.getByText("Áo Thun Unisex")).toBeInTheDocument();
    expect(screen.getByText("Đen / L")).toBeInTheDocument();
    expect(screen.getByTestId("cart-item-qty")).toHaveTextContent("2");
  });

  it("sử dụng icon remove (dấu -) cho nút giảm và icon add (dấu +) cho nút tăng", () => {
    renderRow();
    expect(screen.getByTestId("material-symbol-remove")).toBeInTheDocument();
    expect(screen.getByTestId("material-symbol-add")).toBeInTheDocument();
    expect(screen.queryByTestId("material-symbol-close")).not.toBeInTheDocument();
  });

  it("click nút giảm gọi onDecrement khi quantity > 1", async () => {
    const user = userEvent.setup();
    const { onDecrement } = renderRow();

    const decBtn = screen.getByRole("button", { name: /Giảm số lượng/ });
    await user.click(decBtn);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it("disabled nút giảm khi quantity <= 1", () => {
    renderRow({ item: { ...MOCK_ITEM, quantity: 1 } });
    const decBtn = screen.getByRole("button", { name: /Giảm số lượng/ });
    expect(decBtn).toBeDisabled();
  });

  it("disabled các nút khi isLoading = true", () => {
    renderRow({ isLoading: true });
    expect(screen.getByRole("button", { name: /Giảm số lượng/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Tăng số lượng/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Xoá|Xóa/ })).toBeDisabled();
  });

  it("click nút tăng gọi onIncrement", async () => {
    const user = userEvent.setup();
    const { onIncrement } = renderRow();

    const incBtn = screen.getByRole("button", { name: /Tăng số lượng/ });
    await user.click(incBtn);
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it("click nút xoá gọi onRemove", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow();

    const removeBtn = screen.getByRole("button", { name: /Xoá|Xóa/ });
    await user.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
