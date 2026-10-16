/**
 * Test cho OrderDetailClient (RED → GREEN).
 *
 * Mock:
 *   - useOrderPayment (TanStack Query + WS + polling)
 *   - PaymentZaloPayPanel (replace bằng stub DOM dễ assert)
 *   - next-intl useTranslations
 *
 * Test:
 *   1. Loading state → render skeleton
 *   2. Error state → render error UI
 *   3. Empty (data undefined sau load) → render "not found"
 *   4. Có data → render panel + order code
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PaymentResponse } from "@/features/checkout/payment.types";

const ORDER_ID = 42;
const ORDER_CODE = "ORD_2026_001234";

const PENDING_PAYMENT: PaymentResponse = {
  id: 123,
  orderId: ORDER_ID,
  orderCode: ORDER_CODE,
  paymentMethod: "ZALOPAY",
  transactionCode: "ZP1697356800000_42",
  amount: 150000,
  qrCodeUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA",
  paymentUrl: "https://sb-openapi.zalopay.vn/pay?token=abc123",
  status: "PENDING",
  paidAt: null,
  createdAt: "2026-10-16T10:30:00.000Z",
};

// Mock useOrderPayment
const mockUseOrderPayment = vi.fn();
vi.mock("@/features/checkout", () => ({
  useOrderPayment: (...args: unknown[]) => mockUseOrderPayment(...args),
}));

// Mock PaymentZaloPayPanel — render div có data-testid để dễ assert
vi.mock("@/features/checkout/components/PaymentZaloPayPanel", () => ({
  PaymentZaloPayPanel: (props: {
    orderId: number;
    orderCode: string;
  }) => (
    <div
      data-testid="payment-panel"
      data-order-id={props.orderId}
      data-order-code={props.orderCode}
    />
  ),
}));

// Mock next-intl (plain function — useTranslations dùng i18n key trực tiếp)
vi.mock("next-intl", () => ({
  useTranslations:
    () =>
    (key: string, params?: Record<string, string | number>) => {
      if (params && key === "detail.orderCode") {
        return `Mã đơn: ${params.code ?? ""}`;
      }
      return key;
    },
}));

// Import sau mocks
import { OrderDetailClient } from "./OrderDetailClient";

beforeEach(() => {
  mockUseOrderPayment.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("OrderDetailClient — loading state", () => {
  it("render skeleton khi useOrderPayment đang loading", () => {
    mockUseOrderPayment.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<OrderDetailClient orderId={ORDER_ID} />);
    expect(screen.getByTestId("order-detail-loading")).toBeInTheDocument();
  });
});

describe("OrderDetailClient — error state", () => {
  it("render error UI khi useOrderPayment trả error", () => {
    mockUseOrderPayment.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network failed"),
    });

    render(<OrderDetailClient orderId={ORDER_ID} />);
    expect(screen.getByTestId("order-detail-error")).toBeInTheDocument();
    expect(screen.getByText("Network failed")).toBeInTheDocument();
  });
});

describe("OrderDetailClient — empty state", () => {
  it("render 'not found' khi không có data và không lỗi", () => {
    mockUseOrderPayment.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<OrderDetailClient orderId={ORDER_ID} />);
    expect(screen.getByTestId("order-detail-empty")).toBeInTheDocument();
  });
});

describe("OrderDetailClient — success state", () => {
  beforeEach(() => {
    mockUseOrderPayment.mockReturnValue({
      data: PENDING_PAYMENT,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("render panel + order code", () => {
    render(<OrderDetailClient orderId={ORDER_ID} />);
    expect(screen.getByTestId("order-detail")).toBeInTheDocument();

    const panel = screen.getByTestId("payment-panel");
    expect(panel).toBeInTheDocument();
    expect(panel.getAttribute("data-order-id")).toBe(String(ORDER_ID));
    expect(panel.getAttribute("data-order-code")).toBe(ORDER_CODE);
  });

  it("hiển thị order code trong header", () => {
    render(<OrderDetailClient orderId={ORDER_ID} />);
    // expect ORD_CODE somewhere visible
    expect(screen.getAllByText(ORDER_CODE).length).toBeGreaterThan(0);
  });
});
