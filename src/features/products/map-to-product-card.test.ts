/**
 * Unit tests cho mapToProductCardProps.
 *
 * Rule: test phải cover các branch quan trọng:
 *  - hasDiscount = true (minPrice < maxPrice) → price + originalPrice + discountPercent
 *  - hasDiscount = false (minPrice == maxPrice) → chỉ price, không có originalPrice
 *  - maxPrice = 0 (edge case) → tránh chia cho 0
 *  - totalSold null/undefined → soldCount undefined
 *  - location = storeName
 */

import { describe, expect, it } from "vitest";

import type { RecommendedProductResponse } from "@/features/homepage/api";

import { mapToProductCardProps } from "./map-to-product-card";

const baseProduct: RecommendedProductResponse = {
  id: 1,
  storeId: 10,
  storeName: "Sony Audio",
  name: "Sony WF-C500",
  imageUrl: "https://example.com/x.jpg",
  minPrice: 990000,
  maxPrice: 1520000,
  totalStock: 100,
  totalSold: 1800,
  label: null,
};

describe("mapToProductCardProps", () => {
  it("maps minPrice → price and maxPrice → originalPrice when hasDiscount", () => {
    const props = mapToProductCardProps(baseProduct);
    expect(props.price).toBe(990000);
    expect(props.originalPrice).toBe(1520000);
    // (1520000 - 990000) / 1520000 = 0.3486... -> 35
    expect(props.discountPercent).toBe(35);
  });

  it("omits originalPrice when minPrice == maxPrice (no discount)", () => {
    const props = mapToProductCardProps({ ...baseProduct, minPrice: 1000000, maxPrice: 1000000 });
    expect(props.price).toBe(1000000);
    expect(props.originalPrice).toBeUndefined();
    expect(props.discountPercent).toBeUndefined();
  });

  it("handles maxPrice = 0 without division by zero (no discount)", () => {
    const props = mapToProductCardProps({ ...baseProduct, minPrice: 0, maxPrice: 0 });
    expect(props.price).toBe(0);
    expect(props.originalPrice).toBeUndefined();
    expect(props.discountPercent).toBeUndefined();
  });

  it("maps totalSold → soldCount", () => {
    const props = mapToProductCardProps({ ...baseProduct, totalSold: 4500 });
    expect(props.soldCount).toBe(4500);
  });

  it("handles totalSold = 0 → soldCount = 0", () => {
    const props = mapToProductCardProps({ ...baseProduct, totalSold: 0 });
    expect(props.soldCount).toBe(0);
  });

  it("maps storeName → location", () => {
    const props = mapToProductCardProps({ ...baseProduct, storeName: "Apple Flagship Store" });
    expect(props.location).toBe("Apple Flagship Store");
  });

  it("maps name → imageAlt + title", () => {
    const props = mapToProductCardProps(baseProduct);
    expect(props.title).toBe("Sony WF-C500");
    expect(props.imageAlt).toBe("Sony WF-C500");
  });

  it("falls back to empty string when imageUrl is empty", () => {
    const props = mapToProductCardProps({ ...baseProduct, imageUrl: "" });
    expect(props.imageUrl).toBe("");
  });

  it("does not set rating (BE chưa trả)", () => {
    const props = mapToProductCardProps(baseProduct);
    expect(props.rating).toBeUndefined();
  });
});
