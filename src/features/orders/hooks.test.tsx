/**
 * Tests cho useOrderSuccessByCode hook.
 *
 * Hook fetch chi tiết nhiều orders theo orderCode (comma-separated)
 * rồi aggregate thành OrderSuccessView dùng cho trang success.
 *
 * Test strategy:
 *  - Empty orderCode → query disabled, return undefined
 *  - orderCode = "FS-001" → fetch getOrdersByCode, trả OrderSuccessView
 *  - Network error → query isError
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useOrderSuccessByCode } from "./hooks";
import { getOrdersByCode } from "./api";
import type { OrderSuccessView } from "./types";

// Mock api module
vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return {
    ...actual,
    getOrdersByCode: vi.fn(),
  };
});

const mockGetOrdersByCode = vi.mocked(getOrdersByCode);

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function TestQueryProvider({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  TestQueryProvider.displayName = "TestQueryProvider";
  return TestQueryProvider;
}

describe("useOrderSuccessByCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined and skips fetch when orderCode is empty", () => {
    const { result } = renderHook(() => useOrderSuccessByCode(""), {
      wrapper: makeWrapper(),
    });
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetching).toBe(false);
    expect(mockGetOrdersByCode).not.toHaveBeenCalled();
  });

  it("fetches OrderSuccessView and exposes data on success", async () => {
    const mockView: OrderSuccessView = {
      orderCodes: ["FS-261001-A7K2Q"],
      grandTotal: 1_292_000,
      totalItems: 3,
      totalOrders: 2,
      address: {
        recipientName: "Nguyễn Văn An",
        phone: "0901 234 567",
        fullAddress: "450 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM",
      },
      orders: [
        {
          orderCode: "FS-261001-A7K2Q",
          storeId: 1,
          storeName: "UTC Fashion Mall",
          storeBadge: "Mall",
          amount: 538_000,
          paymentStatus: "SUCCESS",
          paymentMethod: "ZALOPAY",
        },
        {
          orderCode: "TZ-261001-B9X8M",
          storeId: 2,
          storeName: "TechZone Official",
          storeBadge: "OfficialMall",
          amount: 754_000,
          paymentStatus: "SUCCESS",
          paymentMethod: "ZALOPAY",
        },
      ],
      estimatedDeliveryLabel: "Dự kiến giao ngày mai",
    };
    mockGetOrdersByCode.mockResolvedValueOnce(mockView);

    const { result } = renderHook(
      () => useOrderSuccessByCode("FS-261001-A7K2Q"),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockView);
    expect(mockGetOrdersByCode).toHaveBeenCalledWith("FS-261001-A7K2Q");
  });

  it("exposes isError when API throws", async () => {
    mockGetOrdersByCode.mockRejectedValueOnce(new Error("Network failed"));
    const { result } = renderHook(
      () => useOrderSuccessByCode("FS-261001-A7K2Q"),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
