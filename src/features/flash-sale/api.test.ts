/**
 * Tests cho Flash Sale API layer.
 *
 * Test các endpoint:
 * - POST /api/v1/flash-sales/reserve
 * - DELETE /api/v1/flash-sales/reservations/{reservationId}
 * - GET /api/v1/flash-sales/items/active (M.7, Swagger 2026-10-17)
 *
 * Coverage:
 * - M.6: ReservationResponse phai match Swagger moi (them status, message, orderId; bo slotId)
 * - M.7: getActiveFlashSaleItems goi GET /flash-sales/items/active
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  reserveFlashSale,
  cancelReservation,
  type ReserveFlashSaleRequest,
  type ReservationResponse,
  type CancelReservationResponse,
} from "./api";

// Mock apiFetch
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

// Import after mock
import { apiFetch } from "@/lib/api";

const mockApiFetch = vi.mocked(apiFetch);

describe("Flash Sale Reservation API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reserveFlashSale", () => {
    const mockRequest: ReserveFlashSaleRequest = {
      flashSaleItemId: 101,
      addressId: 15,
      quantity: 1,
    };

    // Swagger 2026-10-17 ReservationResponse:
    // orderId, orderCode, flashSaleItemId, quantity, flashSalePrice,
    // totalAmount, status, expiresAt, message, reservationId
    // (KHONG co slotId nhu fixture cu)
    const mockReservationResponse: ReservationResponse = {
      orderId: 42,
      orderCode: "FS-1791963512929-3365",
      flashSaleItemId: 101,
      quantity: 1,
      flashSalePrice: 99000,
      totalAmount: 99000,
      status: "PENDING_PAYMENT",
      expiresAt: "2026-10-14T14:40:00.000Z",
      message: "Dat hang thanh cong, vui long thanh toan trong 5 phut",
      reservationId: "FS-1791963512929-3365",
    };

    it("should call POST /api/v1/flash-sales/reserve with correct body", async () => {
      mockApiFetch.mockResolvedValueOnce(mockReservationResponse);

      const result = await reserveFlashSale(mockRequest, "test-uuid-123");

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/flash-sales/reserve",
        expect.objectContaining({
          method: "POST",
          json: {
            flashSaleItemId: 101,
            addressId: 15,
            quantity: 1,
          },
          headers: expect.objectContaining({
            "Idempotency-Key": "test-uuid-123",
          }),
        })
      );
      expect(result).toEqual(mockReservationResponse);
    });

    it("should handle reserve without addressId (BE will use default)", async () => {
      mockApiFetch.mockResolvedValueOnce(mockReservationResponse);

      const requestWithoutAddress: ReserveFlashSaleRequest = {
        flashSaleItemId: 101,
        quantity: 1,
      };

      await reserveFlashSale(requestWithoutAddress, "test-uuid-456");

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/flash-sales/reserve",
        expect.objectContaining({
          json: expect.not.objectContaining({ addressId: expect.anything() }),
        })
      );
    });

    it("should parse reservation response correctly", async () => {
      mockApiFetch.mockResolvedValueOnce(mockReservationResponse);

      const result = await reserveFlashSale(mockRequest, "test-uuid");

      // M.6: assert fields theo Swagger moi
      expect(result.reservationId).toBe("FS-1791963512929-3365");
      expect(result.orderCode).toBe("FS-1791963512929-3365");
      expect(result.orderId).toBe(42);
      expect(result.status).toBe("PENDING_PAYMENT");
      expect(result.message).toContain("thanh cong");
      expect(result.flashSalePrice).toBe(99000);
      expect(result.totalAmount).toBe(99000);
      expect(result.expiresAt).toBe("2026-10-14T14:40:00.000Z");
    });
  });

  describe("cancelReservation", () => {
    const reservationId = "FS-1791963512929-3365";

    const mockCancelResponse: CancelReservationResponse = {
      success: true,
      message: "Khách hàng userId=5 đã hủy thành công giữ chỗ reservationId=FS-1791963512929-3365",
    };

    it("should call DELETE /api/v1/flash-sales/reservations/{reservationId}", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCancelResponse);

      const result = await cancelReservation(reservationId);

      expect(mockApiFetch).toHaveBeenCalledWith(
        `/api/v1/flash-sales/reservations/${encodeURIComponent(reservationId)}`,
        expect.objectContaining({
          method: "DELETE",
        })
      );
      expect(result).toEqual(mockCancelResponse);
    });

    it("should return success true on successful cancellation", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCancelResponse);

      const result = await cancelReservation(reservationId);

      expect(result.success).toBe(true);
      expect(result.message).toContain("hủy thành công");
    });
  });
});

// ── M.7: getActiveFlashSaleItems ──────────────────────────────────────────
import { getActiveFlashSaleItems } from "./api";
import type { PublicFlashSaleItemResponse } from "./api";

describe("getActiveFlashSaleItems (M.7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const MOCK_ACTIVE_ITEM: PublicFlashSaleItemResponse = {
    id: 501,
    slotId: 1,
    variantId: 42,
    sku: "AT-DEN-M",
    variantName: "Đen, Size M",
    productName: "Áo thun cotton oversize",
    imageUrl: "https://cdn.example.com/product.jpg",
    originalPrice: 199_000,
    flashSalePrice: 99_000,
    allocatedStock: 100,
    availableStock: 73,
    userPurchaseLimit: 2,
    status: "ACTIVE",
  };

  it("calls GET /api/v1/flash-sales/items/active", async () => {
    mockApiFetch.mockResolvedValueOnce([MOCK_ACTIVE_ITEM]);

    await getActiveFlashSaleItems();

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/flash-sales/items/active"
    );
  });

  it("returns array of active items", async () => {
    mockApiFetch.mockResolvedValueOnce([MOCK_ACTIVE_ITEM]);

    const result = await getActiveFlashSaleItems();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(MOCK_ACTIVE_ITEM);
  });

  it("returns empty array when no active items", async () => {
    mockApiFetch.mockResolvedValueOnce([]);

    const result = await getActiveFlashSaleItems();

    expect(result).toEqual([]);
  });
});
