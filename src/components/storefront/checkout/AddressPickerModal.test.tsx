/**
 * Tests for AddressPickerModal.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddressPickerModal } from "./AddressPickerModal";
import type { Address } from "@/features/checkout";

const ADDRESSES: Address[] = [
  {
    id: 1,
    recipientName: "Nguyễn Văn An",
    phone: "0901 234 567",
    street: "450 Lê Văn Việt",
    ward: "P. Tăng Nhơn Phú A",
    district: "TP. Thủ Đức",
    city: "TP.HCM",
    isDefault: true,
  },
  {
    id: 2,
    recipientName: "Trần Thị Bình",
    phone: "0988 765 432",
    street: "68 Nguyễn Huệ",
    ward: "P. Bến Nghé",
    district: "Quận 1",
    city: "TP.HCM",
    isDefault: false,
  },
];

describe("AddressPickerModal", () => {
  it("không render gì khi open = false", () => {
    const { container } = render(
      <AddressPickerModal
        open={false}
        addresses={ADDRESSES}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("render danh sách địa chỉ và tiêu đề khi open = true", () => {
    render(
      <AddressPickerModal
        open
        addresses={ADDRESSES}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByText("Chọn địa chỉ giao hàng"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("address-option-1")).toBeInTheDocument();
    expect(screen.getByTestId("address-option-2")).toBeInTheDocument();
  });

  it("gọi onSelect khi bấm 1 địa chỉ", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <AddressPickerModal
        open
        addresses={ADDRESSES}
        selectedId={1}
        onSelect={onSelect}
        onClose={() => {}}
      />,
    );
    await user.click(screen.getByTestId("address-option-2"));
    expect(onSelect).toHaveBeenCalledWith(ADDRESSES[1]);
  });

  it("gọi onClose khi bấm nút đóng hoặc ngoài Xong", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AddressPickerModal
        open
        addresses={ADDRESSES}
        onSelect={() => {}}
        onClose={onClose}
      />,
    );
    await user.click(screen.getByTestId("address-picker-done"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("gọi onAddNew khi bấm nút Thêm địa chỉ mới", async () => {
    const user = userEvent.setup();
    const onAddNew = vi.fn();
    render(
      <AddressPickerModal
        open
        addresses={ADDRESSES}
        onSelect={() => {}}
        onAddNew={onAddNew}
        onClose={() => {}}
      />,
    );
    await user.click(screen.getByTestId("address-picker-add"));
    expect(onAddNew).toHaveBeenCalledOnce();
  });

  it("hiển thị empty state khi addresses rỗng", () => {
    render(
      <AddressPickerModal
        open
        addresses={[]}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByText(/Bạn chưa có địa chỉ nào/),
    ).toBeInTheDocument();
  });
});
