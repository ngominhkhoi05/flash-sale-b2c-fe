import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useMyVouchers, voucherKeys } from "./hooks";
import type { UserVoucher } from "./types";

const mockGetMyVouchers = vi.fn();
vi.mock("./api", () => ({
  getMyVouchers: () => mockGetMyVouchers(),
}));

function withQueryClient() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => mockGetMyVouchers.mockReset());

describe("voucherKeys", () => {
  it("builds canonical key shape", () => {
    expect(voucherKeys.all).toEqual(["vouchers"]);
    expect(voucherKeys.mine()).toEqual(["vouchers", "mine"]);
  });
});

describe("useMyVouchers", () => {
  it("fetches user vouchers and exposes data", async () => {
    const vouchers: UserVoucher[] = [
      {
        id: "v1",
        code: "SALE50K",
        name: "Giảm 50K",
        type: "DISCOUNT",
        scope: "ORDER",
        discountValue: 50000,
        discountUnit: "FIXED_AMOUNT",
        minOrderAmount: 200000,
        startTime: "2026-10-01T00:00:00Z",
        endTime: "2026-10-31T23:59:59Z",
        status: "ACTIVE",
        userUsageCount: 0,
        userUsageLimit: 1,
      },
    ];
    mockGetMyVouchers.mockResolvedValue(vouchers);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useMyVouchers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(vouchers);
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useMyVouchers(false), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockGetMyVouchers).not.toHaveBeenCalled();
  });
});
