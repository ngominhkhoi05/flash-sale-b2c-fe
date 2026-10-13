/**
 * Unit tests cho hooks.ts.
 *
 * Test logic pure (filter/transform), không cần renderHook.
 */

import { describe, expect, it } from "vitest";
import {
  pickActiveSlot,
  pickUpcomingSlot,
  isAlmostSoldOut,
  isSoldOut,
  computeSoldPercent,
  computeDiscountPercent,
  filterItemsByCategory,
} from "./selectors";
import type { PublicFlashSaleItemResponse } from "./types";

function mkItem(
  id: number,
  overrides: Partial<PublicFlashSaleItemResponse> = {},
): PublicFlashSaleItemResponse {
  return {
    id,
    slotId: 1,
    variantId: id * 10,
    sku: `MOCK-${id}`,
    variantName: "Default",
    productName: `Item ${id}`,
    imageUrl: "https://picsum.photos/seed/x/600/600",
    originalPrice: 1_000_000,
    flashSalePrice: 500_000,
    allocatedStock: 100,
    availableStock: 50,
    userPurchaseLimit: 2,
    status: "APPROVED",
    ...overrides,
  };
}

describe("pickActiveSlot", () => {
  it("trả về slot có status='ACTIVE'", () => {
    const result = pickActiveSlot([
      { id: 1, status: "UPCOMING", items: [] } as never,
      { id: 2, status: "ACTIVE", items: [] } as never,
    ]);
    expect(result?.id).toBe(2);
  });

  it("trả về undefined khi không có slot ACTIVE", () => {
    const result = pickActiveSlot([
      { id: 1, status: "UPCOMING", items: [] } as never,
    ]);
    expect(result).toBeUndefined();
  });

  it("trả về undefined khi slots rỗng", () => {
    expect(pickActiveSlot([])).toBeUndefined();
    expect(pickActiveSlot(undefined)).toBeUndefined();
  });
});

describe("pickUpcomingSlot", () => {
  it("trả về slot UPCOMING đầu tiên", () => {
    const result = pickUpcomingSlot([
      { id: 1, status: "UPCOMING", items: [] } as never,
      { id: 2, status: "ACTIVE", items: [] } as never,
    ]);
    expect(result?.id).toBe(1);
  });
});

describe("isAlmostSoldOut (>90% sold, còn stock)", () => {
  it("true khi 95% sold", () => {
    const item = mkItem(1, { allocatedStock: 100, availableStock: 5 });
    expect(isAlmostSoldOut(item)).toBe(true);
  });

  it("true khi 91% sold", () => {
    const item = mkItem(1, { allocatedStock: 100, availableStock: 9 });
    expect(isAlmostSoldOut(item)).toBe(true);
  });

  it("false khi 90% sold (boundary)", () => {
    const item = mkItem(1, { allocatedStock: 100, availableStock: 10 });
    expect(isAlmostSoldOut(item)).toBe(false);
  });

  it("false khi sold out (availableStock=0) – dùng isSoldOut riêng", () => {
    const item = mkItem(1, { allocatedStock: 100, availableStock: 0 });
    expect(isAlmostSoldOut(item)).toBe(false);
  });
});

describe("isSoldOut", () => {
  it("true khi availableStock = 0", () => {
    expect(isSoldOut(mkItem(1, { availableStock: 0 }))).toBe(true);
  });

  it("false khi availableStock > 0", () => {
    expect(isSoldOut(mkItem(1, { availableStock: 1 }))).toBe(false);
  });
});

describe("computeSoldPercent", () => {
  it("72 khi sold=72, allocated=100", () => {
    expect(
      computeSoldPercent(mkItem(1, { allocatedStock: 100, availableStock: 28 })),
    ).toBe(72);
  });

  it("0 khi allocated=0 (chia 0 protection)", () => {
    expect(computeSoldPercent(mkItem(1, { allocatedStock: 0 }))).toBe(0);
  });

  it("100 khi sold hết", () => {
    expect(
      computeSoldPercent(mkItem(1, { allocatedStock: 100, availableStock: 0 })),
    ).toBe(100);
  });
});

describe("computeDiscountPercent", () => {
  it("45 khi originalPrice=1000, flashSalePrice=550", () => {
    expect(
      computeDiscountPercent(
        mkItem(1, { originalPrice: 1_000_000, flashSalePrice: 550_000 }),
      ),
    ).toBe(45);
  });

  it("0 khi originalPrice=0 (chia 0 protection)", () => {
    expect(computeDiscountPercent(mkItem(1, { originalPrice: 0 }))).toBe(0);
  });

  it("0 khi flashSalePrice >= originalPrice", () => {
    expect(
      computeDiscountPercent(
        mkItem(1, { originalPrice: 1_000_000, flashSalePrice: 1_000_000 }),
      ),
    ).toBe(0);
  });
});

describe("filterItemsByCategory", () => {
  it("trả về tất cả items khi categoryId=null", () => {
    const items = [mkItem(1), mkItem(2)];
    expect(filterItemsByCategory(items, null)).toHaveLength(2);
  });

  it("trả về tất cả items khi item không có categoryId (filter là best-effort)", () => {
    const items = [mkItem(1), mkItem(2)];
    // Hiện tại BE chưa trả categoryId → filter trả về all (no-op)
    expect(filterItemsByCategory(items, 5)).toHaveLength(2);
  });
});
