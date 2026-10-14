/**
 * Tests cho Orders API layer.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOrders,
  getOrderById,
  cancelOrderById,
  type BackendOrderPageResponse,
  type BackendOrderDetail,
} from "./api";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api";

const mockApiFetch = vi.mocked(apiFetch);

describe("Orders API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrders", () => {
    const mockResponse: BackendOrderPageResponse = {
      items: [
        {
          id: 100,
          orderCode: "FS-2026-001",
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          totalAmount: 99000,
          totalItems: 1,
          storeName: "Shop ABC",
          thumbnail: "https://example.com/img.jpg",
          createdAt: "2026-10-14T10:00:00Z",
          expiresAt: "2026-10-14T10:05:00Z",
        },
      ],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      isFirst: true,
      isLast: true,
      hasNext: false,
      hasPrevious: false,
    };

    it("should call GET /api/v1/orders with default params", async () => {
      mockApiFetch.mockResolvedValueOnce(mockResponse);
      const result = await getOrders();
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/orders",
        expect.objectContaining({
          method: "GET",
          query: expect.objectContaining({ page: 0, size: 10 }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should support status filter", async () => {
      mockApiFetch.mockResolvedValueOnce(mockResponse);
      await getOrders({ status: "PENDING_PAYMENT", page: 1, size: 20 });
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/orders",
        expect.objectContaining({
          query: expect.objectContaining({
            status: "PENDING_PAYMENT",
            page: 1,
            size: 20,
          }),
        })
      );
    });
  });

  describe("getOrderById", () => {
    const mockDetail: BackendOrderDetail = {
      id: 100,
      orderCode: "FS-2026-001",
      buyerId: 5,
      storeId: 2,
      storeName: "Shop ABC",
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      paymentMethod: "ZALOPAY",
      shippingAddress: {
        recipientName: "Nguyễn Văn A",
        phone: "0987654321",
        fullAddress: "12 Nguyễn Huệ, Quận 1, TP.HCM",
        province: "TP. Hồ Chí Minh",
        district: "Quận 1",
        ward: "Phường Bến Nghé",
        detailAddress: "12 Nguyễn Huệ",
      },
      items: [],
      subtotal: 99000,
      shippingFee: 0,
      discountAmount: 0,
      voucherCode: null,
      totalAmount: 99000,
      paymentUrl: "https://example.com/pay",
      qrCodeUrl: "https://example.com/qr.png",
      expiresAt: "2026-10-14T10:05:00Z",
      createdAt: "2026-10-14T10:00:00Z",
      confirmedAt: null,
      shippedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
    };

    it("should call GET /api/v1/orders/{id}", async () => {
      mockApiFetch.mockResolvedValueOnce(mockDetail);
      const result = await getOrderById(100);
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/orders/100",
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockDetail);
    });
  });

  describe("cancelOrderById", () => {
    it("should call PATCH /api/v1/orders/{id}/cancel with reason", async () => {
      const mockResponse = {
        success: true,
        orderCode: "FS-2026-001",
        message: "Đơn hàng đã được hủy thành công",
      };
      mockApiFetch.mockResolvedValueOnce(mockResponse);

      const result = await cancelOrderById(100, {
        reason: "Đổi ý không mua nữa",
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/orders/100/cancel",
        expect.objectContaining({
          method: "PATCH",
          json: { reason: "Đổi ý không mua nữa" },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should support cancel without reason", async () => {
      const mockResponse = {
        success: true,
        orderCode: "FS-2026-001",
        message: "Đơn hàng đã được hủy",
      };
      mockApiFetch.mockResolvedValueOnce(mockResponse);

      await cancelOrderById(100);

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/orders/100/cancel",
        expect.objectContaining({
          json: {},
        })
      );
    });
  });
});
