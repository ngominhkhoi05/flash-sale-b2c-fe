/**
 * Unit tests cho CartItemRow.
 * Kiểm tra:
 * - Nút giảm hiển thị icon "remove" (dấu -) thay vì "close" (dấu x)
 * - Nút tăng hiển thị icon "add" (dấu +)
 * - Nút giảm bị disabled khi quantity <= 1 hoặc isLoading
 * - Ô số lượng là input nhập được, hiển thị đúng giá trị ban đầu
 * - Nhập số có số 0 ở đầu (01 -> hiển thị 1)
 * - Không cho nhập âm (ví dụ: -5 -> loại bỏ dấu - thành 5)
 * - Chặn ký tự chữ hoặc ký tự đặc biệt
 * - Nhập 0 và blur/Enter -> gọi onRemove (xoá khỏi giỏ hàng)
 * - Nhập số hợp lệ (ví dụ: 5) và blur/Enter -> gọi onChangeQuantity
 * - Click nút giảm gọi onDecrement
 * - Click nút tăng gọi onIncrement
 * - Click nút xoá gọi onRemove
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
  const onChangeQuantity = vi.fn();
  const onRemove = vi.fn();

  render(
    <TestWrapper>
      <CartItemRow
        item={MOCK_ITEM}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onChangeQuantity={onChangeQuantity}
        onRemove={onRemove}
        {...props}
      />
    </TestWrapper>,
  );

  return { onIncrement, onDecrement, onChangeQuantity, onRemove };
}

describe("CartItemRow", () => {
  it("hiển thị thông tin sản phẩm và ô input số lượng", () => {
    renderRow();
    expect(screen.getByText("Áo Thun Unisex")).toBeInTheDocument();
    expect(screen.getByText("Đen / L")).toBeInTheDocument();
    const qtyInput = screen.getByTestId("cart-item-qty");
    expect(qtyInput).toHaveValue("2");
  });

  it("sử dụng icon remove (dấu -) cho nút giảm và icon add (dấu +) cho nút tăng", () => {
    renderRow();
    expect(screen.getByTestId("material-symbol-remove")).toBeInTheDocument();
    expect(screen.getByTestId("material-symbol-add")).toBeInTheDocument();
    expect(screen.queryByTestId("material-symbol-close")).not.toBeInTheDocument();
  });

  it("hiển thị nút xoá dưới dạng icon delete nằm ngang hàng với cụm số lượng", () => {
    renderRow();
    const deleteIcon = screen.getByTestId("material-symbol-delete");
    expect(deleteIcon).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: /Xoá|Xóa/ });
    expect(removeBtn).toContainElement(deleteIcon);
  });

  it("khi nhập 01 -> hiển thị 1 (loại bỏ leading zero)", () => {
    renderRow();
    const qtyInput = screen.getByTestId("cart-item-qty");
    fireEvent.change(qtyInput, { target: { value: "01" } });
    expect(qtyInput).toHaveValue("1");
  });

  it("khi nhập số có nhiều số 0 ở đầu (007) -> hiển thị 7", () => {
    renderRow();
    const qtyInput = screen.getByTestId("cart-item-qty");
    fireEvent.change(qtyInput, { target: { value: "007" } });
    expect(qtyInput).toHaveValue("7");
  });

  it("không cho nhập âm: nhập -5 tự động loại bỏ dấu âm thành 5", () => {
    renderRow();
    const qtyInput = screen.getByTestId("cart-item-qty");
    fireEvent.change(qtyInput, { target: { value: "-5" } });
    expect(qtyInput).toHaveValue("5");
  });

  it("chặn các ký tự chữ hoặc ký tự đặc biệt", () => {
    renderRow();
    const qtyInput = screen.getByTestId("cart-item-qty");
    fireEvent.change(qtyInput, { target: { value: "abc#$%" } });
    expect(qtyInput).toHaveValue("");
  });

  it("nếu về 0 khi blur -> gọi onRemove để xoá khỏi giỏ hàng", () => {
    const { onRemove, onChangeQuantity } = renderRow();
    const qtyInput = screen.getByTestId("cart-item-qty");

    fireEvent.change(qtyInput, { target: { value: "0" } });
    expect(qtyInput).toHaveValue("0");

    fireEvent.blur(qtyInput);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onChangeQuantity).toHaveBeenCalledWith(0);
  });

  it("nếu về 0 khi nhấn Enter -> gọi onRemove để xoá khỏi giỏ hàng", () => {
    const { onRemove } = renderRow();
    const qtyInput = screen.getByTestId("cart-item-qty");

    fireEvent.change(qtyInput, { target: { value: "0" } });
    fireEvent.keyDown(qtyInput, { key: "Enter" });

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("nhập số lượng hợp lệ (ví dụ: 5) và blur -> gọi onChangeQuantity với 5", () => {
    const { onChangeQuantity } = renderRow();
    const qtyInput = screen.getByTestId("cart-item-qty");

    fireEvent.change(qtyInput, { target: { value: "5" } });
    expect(qtyInput).toHaveValue("5");

    fireEvent.blur(qtyInput);
    expect(onChangeQuantity).toHaveBeenCalledWith(5);
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

  it("disabled các nút và input khi isLoading = true", () => {
    renderRow({ isLoading: true });
    expect(screen.getByRole("button", { name: /Giảm số lượng/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Tăng số lượng/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Xoá|Xóa/ })).toBeDisabled();
    expect(screen.getByTestId("cart-item-qty")).toBeDisabled();
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
