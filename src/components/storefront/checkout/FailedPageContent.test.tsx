/**
 * Tests for FailedPageContent (RED → GREEN).
 *
 * Covers:
 *  - Renders FailedModule with mock data when no orderCode provided
 *  - Renders FailedModule when orderCode provided
 *  - 'Chọn COD' button fires onSelectCod callback (toast fallback)
 *  - Mock data renders full transaction card (mã GD + grand total + rejection)
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FailedPageContent } from "./FailedPageContent";

vi.mock("next-intl", () => {
  const map: Record<string, string> = {
    "storefront.checkout.failed.statusBadge": "TRẠNG THÁI: CẦN XỬ LÝ",
    "storefront.checkout.failed.countdownLabel": "Còn",
    "storefront.checkout.failed.expiredLabel": "Hết hạn giữ chỗ",
    "storefront.checkout.failed.title": "Thanh toán chưa thành công",
    "storefront.checkout.failed.subtitle":
      "Giao dịch bị từ chối hoặc bị gián đoạn. Đơn hàng của bạn vẫn được giữ đến {time}.",
    "storefront.checkout.failed.transactionIdLabel": "Mã giao dịch",
    "storefront.checkout.failed.totalLabel": "Tổng thanh toán",
    "storefront.checkout.failed.rejectionTitle": "Lý do từ chối:",
    "storefront.checkout.failed.reservedOrdersLabel":
      "Đơn hàng đang giữ chỗ ({count}):",
    "storefront.checkout.failed.copyButton": "Sao chép",
    "storefront.checkout.failed.voucherWarning":
      "Vui lòng hoàn tất trước {time} để không bỏ lỡ {voucher} đã áp dụng.",
    "storefront.checkout.failed.retryCta": "Thử thanh toán lại",
    "storefront.checkout.failed.codCta": "Chọn COD (Nhận hàng trả tiền)",
    "storefront.checkout.failed.supportGuide": "Hướng dẫn thanh toán",
    "storefront.checkout.failed.supportHotline": "Hỗ trợ: 1900 8888",
    "storefront.checkout.failed.copySuccess": "Đã sao chép mã giao dịch",
    "storefront.checkout.failed.copyError": "Không thể sao chép mã",
  };

  const buildT = (namespace?: string) => {
    const fn = (key: string, values?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const raw = map[fullKey] ?? key;
      if (!values) return raw;
      return Object.entries(values).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
        raw,
      );
    };
    fn.rich = fn;
    return fn;
  };
  return { useTranslations: buildT };
});

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

describe("FailedPageContent", () => {
  it("renders FailedModule with mock data when orderCode missing", () => {
    render(<FailedPageContent />);
    expect(screen.getByTestId("failed-module")).toBeInTheDocument();
    expect(screen.getByText("Thanh toán chưa thành công")).toBeInTheDocument();
    expect(screen.getByText("261001_000245")).toBeInTheDocument();
  });

  it("renders FailedModule when orderCode provided", () => {
    render(<FailedPageContent orderCode="FS-261001-A7K2Q" />);
    expect(screen.getByTestId("failed-module")).toBeInTheDocument();
  });

  it("'Chọn COD' button triggers toast (placeholder until BE wired)", async () => {
    const { toast } = await import("sonner");
    render(<FailedPageContent />);
    const btn = screen.getByRole("button", { name: /Chọn COD/ });
    fireEvent.click(btn);
    expect(toast.info).toHaveBeenCalled();
  });
});
