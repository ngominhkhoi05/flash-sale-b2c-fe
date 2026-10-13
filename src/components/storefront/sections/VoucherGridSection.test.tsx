/**
 * Unit tests cho VoucherGridSection (API-driven).
 * - Logic state: button "Lưu" toggle "Đã lưu" khi click
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VoucherGridSection } from "./VoucherGridSection";
import { TestWrapper } from "@/__tests__/test-wrapper";
import type { VoucherResponse } from "@/features/homepage/api";

const MOCK_VOUCHERS: VoucherResponse[] = [
  { id: 1, code: "WELCOME10", storeId: null, discountType: "PERCENTAGE", discountValue: 10, minOrderAmount: 199000, maxDiscountAmount: null, totalQuantity: 100, usedQuantity: 0, userUsageLimit: 1, startTime: "2026-01-01", endTime: "2026-12-31", status: "ACTIVE", createdAt: "2026-01-01" },
  { id: 2, code: "SAVE50K", storeId: null, discountType: "FIXED_AMOUNT", discountValue: 50000, minOrderAmount: 299000, maxDiscountAmount: null, totalQuantity: 50, usedQuantity: 0, userUsageLimit: 1, startTime: "2026-01-01", endTime: "2026-12-31", status: "ACTIVE", createdAt: "2026-01-01" },
  { id: 3, code: "FREESHIP", storeId: null, discountType: "FIXED_AMOUNT", discountValue: 30000, minOrderAmount: 150000, maxDiscountAmount: null, totalQuantity: 200, usedQuantity: 0, userUsageLimit: 1, startTime: "2026-01-01", endTime: "2026-12-31", status: "ACTIVE", createdAt: "2026-01-01" },
  { id: 4, code: "VIP15", storeId: null, discountType: "PERCENTAGE", discountValue: 15, minOrderAmount: 1000000, maxDiscountAmount: null, totalQuantity: 30, usedQuantity: 0, userUsageLimit: 1, startTime: "2026-01-01", endTime: "2026-12-31", status: "ACTIVE", createdAt: "2026-01-01" },
];

vi.mock("@/features/homepage/hooks", () => ({
  usePlatformVouchers: () => ({
    data: MOCK_VOUCHERS,
    isLoading: false,
    isError: false,
  }),
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderWithProviders(ui: React.ReactNode) {
  const client = makeQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>
  );
}

describe("VoucherGridSection – save state (API-driven)", () => {
  it("renders 4 'Lưu' buttons by default", () => {
    renderWithProviders(<VoucherGridSection />);
    // Component uses mock hook directly, so data is sync
    const saveButtons = screen.getAllByRole("button", { name: /^lưu$/i });
    expect(saveButtons.length).toBeGreaterThanOrEqual(4);
  });

  it("clicking Save toggles to Saved for that ticket only", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoucherGridSection />);
    await waitFor(() => {
      expect(screen.getByTestId("save-1")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("save-1"));
    const saved = screen.getByRole("button", { name: /đã lưu/i });
    expect(saved).toBeInTheDocument();
    expect(saved).toHaveAttribute("data-testid", "save-1");
  });
});
