/**
 * Tests cho Flash Sale API layer.
 *
 * Test các endpoint:
 * - POST /api/v1/flash-sales/reserve
 * - DELETE /api/v1/flash-sales/reservations/{reservationId}
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

    const mockReservationResponse: ReservationResponse = {
      reservationId: "FS-1791963512929-3365",
      orderCode: "FS-1791963512929-3365",
      slotId: 1,
      flashSaleItemId: 101,
      quantity: 1,
      flashSalePrice: 99000,
      totalAmount: 99000,
      expiresAt: "2026-10-14T14:40:00.000Z",
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

      expect(result.reservationId).toBe("FS-1791963512929-3365");
      expect(result.orderCode).toBe("FS-1791963512929-3365");
      expect(result.slotId).toBe(1);
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
