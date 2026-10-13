/**
 * Tests for CheckoutAddressCard.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutAddressCard } from "./CheckoutAddressCard";
import type { Address } from "@/features/checkout";

const MOCK_ADDRESS: Address = {
  id: 1,
  recipientName: "Nguyễn Văn An",
  phone: "0901 234 567",
  street: "Số 450 Lê Văn Việt",
  ward: "Phường Tăng Nhơn Phú A",
  district: "TP. Thủ Đức",
  city: "TP. Hồ Chí Minh",
  isDefault: true,
};

describe("CheckoutAddressCard", () => {
  it("hiển thị tên, sđt và địa chỉ đầy đủ", () => {
    render(<CheckoutAddressCard address={MOCK_ADDRESS} onChange={() => {}} />);
    expect(screen.getByText("Nguyễn Văn An")).toBeInTheDocument();
    expect(screen.getByText("0901 234 567")).toBeInTheDocument();
    expect(screen.getByText(/Số 450 Lê Văn Việt/)).toBeInTheDocument();
  });

  it("hiển thị badge Mặc định khi isDefault = true", () => {
    render(<CheckoutAddressCard address={MOCK_ADDRESS} onChange={() => {}} />);
    expect(screen.getByText("Mặc định")).toBeInTheDocument();
  });

  it("gọi onChange khi bấm nút Thay đổi", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckoutAddressCard address={MOCK_ADDRESS} onChange={onChange} />);
    await user.click(screen.getByTestId("change-address-button"));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("ẩn nút Thay đổi khi hideChangeButton = true", () => {
    render(
      <CheckoutAddressCard
        address={MOCK_ADDRESS}
        onChange={() => {}}
        hideChangeButton
      />,
    );
    expect(
      screen.queryByTestId("change-address-button"),
    ).not.toBeInTheDocument();
  });
});
