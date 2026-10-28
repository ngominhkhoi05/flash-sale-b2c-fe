/**
 * FlashSalePageContent smoke test.
 * Test 4 trạng thái của branch LIVE (mock=true → render body, mock=false → loading/error/empty/data).
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { TestWrapper } from "@/__tests__/test-wrapper";

// Mock hook useFlashSaleSlots
const mockUseFlashSaleSlots = vi.fn();
vi.mock("@/features/flash-sale", async () => {
  const actual = await vi.importActual<typeof import("@/features/flash-sale")>(
    "@/features/flash-sale",
  );
  return {
    ...actual,
    useFlashSaleSlots: () => mockUseFlashSaleSlots(),
  };
});

import { FlashSalePageContent } from "./FlashSalePageContent";
import { mockFlashSaleSlots } from "@/features/flash-sale/mocks";

describe("FlashSalePageContent", () => {
  const originalEnv = process.env.NEXT_PUBLIC_USE_MOCK;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_USE_MOCK;
    } else {
      process.env.NEXT_PUBLIC_USE_MOCK = originalEnv;
    }
    mockUseFlashSaleSlots.mockReset();
  });

  describe("mock branch (NEXT_PUBLIC_USE_MOCK=true)", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCK = "true";
    });

    it("renders HeroBanner + SlotNav + CountdownBar khi có mock data", () => {
      render(
        <TestWrapper>
          <FlashSalePageContent />
        </TestWrapper>,
      );

      expect(screen.getByTestId("flash-sale-hero")).toBeInTheDocument();
      expect(screen.getByTestId("flash-sale-slot-nav")).toBeInTheDocument();
      expect(screen.getByTestId("flash-sale-countdown")).toBeInTheDocument();
    });

    it("renders all 10 deal cards từ mock ACTIVE slot", () => {
      render(
        <TestWrapper>
          <FlashSalePageContent />
        </TestWrapper>,
      );

      const cards = screen.getAllByTestId("flash-sale-deal-card");
      expect(cards).toHaveLength(10);
    });

    it("renders Upcoming section với 5 item từ mock UPCOMING slot", () => {
      render(
        <TestWrapper>
          <FlashSalePageContent />
        </TestWrapper>,
      );

      expect(screen.getByTestId("flash-sale-upcoming")).toBeInTheDocument();
      const upcomingItems = screen.getAllByTestId(/^upcoming-item-/);
      expect(upcomingItems).toHaveLength(5);
    });

    it("renders CategoryFilter chips", () => {
      render(
        <TestWrapper>
          <FlashSalePageContent />
        </TestWrapper>,
      );

      const filter = screen.getByTestId("flash-sale-category-filter");
      expect(filter).toBeInTheDocument();
    });

    it("does not render LiveIndicator pill", () => {
      render(
        <TestWrapper>
          <FlashSalePageContent />
        </TestWrapper>,
      );

      expect(screen.queryByTestId("flash-sale-live-indicator")).not.toBeInTheDocument();
    });
  });

  describe("live branch (NEXT_PUBLIC_USE_MOCK=false)", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCK = "false";
    });

    it("shows loading skeleton khi useFlashSaleSlots đang loading", () => {
      mockUseFlashSaleSlots.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      });

      const { container } = render(
        <TestWrapper>
          <FlashSalePageContent />
        </TestWrapper>,
      );

      // Skeleton component có class "animate-pulse"
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows ErrorState khi useFlashSaleSlots lỗi", () => {
      mockUseFlashSaleSlots.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        isFetching: false,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <FlashSalePageContent />
        </TestWrapper>,
      );

      expect(screen.getByText(/Không tải được phiên Flash Sale/i)).toBeInTheDocument();
    });

    it("shows empty state khi data rỗng", () => {
      mockUseFlashSaleSlots.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <FlashSalePageContent />
        </TestWrapper>,
      );

      expect(screen.getByText(/Chưa có phiên Flash Sale nào/i)).toBeInTheDocument();
    });

    it("renders HeroBanner + 10 cards khi data thật trả về", () => {
      mockUseFlashSaleSlots.mockReturnValue({
        data: mockFlashSaleSlots,
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <FlashSalePageContent />
        </TestWrapper>,
      );

      expect(screen.getByTestId("flash-sale-hero")).toBeInTheDocument();
      const cards = screen.getAllByTestId("flash-sale-deal-card");
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
