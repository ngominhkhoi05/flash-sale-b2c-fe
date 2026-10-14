/**
 * Tests cho Cart API layer.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type BackendCartResponse,
} from "./api";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api";

const mockApiFetch = vi.mocked(apiFetch);

const mockCart: BackendCartResponse = {
  id: 1,
  userId: 5,
  storeGroups: [
    {
      storeId: 2,
      storeName: "Shop ABC",
      items: [
        {
          id: 11,
          variantId: 42,
          sku: "AT-DEN-M",
          storeId: 2,
          storeName: "Shop ABC",
          productName: "Áo thun nam",
          variantName: "Đen, Size M",
          imageUrl: "https://example.com/img.jpg",
          price: 99000,
          quantity: 2,
          itemSubtotal: 198000,
        },
      ],
      storeSubtotal: 198000,
    },
  ],
  totalItems: 2,
  grandTotal: 198000,
};

describe("Cart API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCart", () => {
    it("should call GET /api/v1/cart", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCart);
      const result = await getCart();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/cart");
      expect(result).toEqual(mockCart);
    });
  });

  describe("addToCart", () => {
    it("should call POST /api/v1/cart/items with correct body", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCart);

      const result = await addToCart({ variantId: 42, quantity: 2 });

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/cart/items",
        expect.objectContaining({
          method: "POST",
          json: { variantId: 42, quantity: 2 },
        })
      );
      expect(result).toEqual(mockCart);
    });
  });

  describe("updateCartItem", () => {
    it("should call PUT /api/v1/cart/items/{itemId} with quantity", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCart);

      const result = await updateCartItem(11, { quantity: 3 });

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/cart/items/11",
        expect.objectContaining({
          method: "PUT",
          json: { quantity: 3 },
        })
      );
      expect(result).toEqual(mockCart);
    });
  });

  describe("removeCartItem", () => {
    it("should call DELETE /api/v1/cart/items/{itemId}", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCart);

      const result = await removeCartItem(11);

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/cart/items/11",
        expect.objectContaining({
          method: "DELETE",
        })
      );
      expect(result).toEqual(mockCart);
    });
  });

  describe("clearCart", () => {
    it("should call DELETE /api/v1/cart", async () => {
      mockApiFetch.mockResolvedValueOnce(undefined);

      await clearCart();

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/cart",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });
});
