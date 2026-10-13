/**
 * Unit tests cho mocks – verify Zod schema pass và structure đúng.
 *
 * TDD: viết test RED trước, sau đó viết mocks cho pass.
 */

import { describe, expect, it } from "vitest";
import { publicFlashSaleSlotResponseSchema } from "./schemas";
import {
  mockFlashSaleSlots,
  getMockActiveSlot,
  getMockUpcomingSlot,
} from "./mocks";

describe("mocks – Zod schema validation", () => {
  it("every mock slot parses successfully against the schema", () => {
    mockFlashSaleSlots.forEach((slot) => {
      const result = publicFlashSaleSlotResponseSchema.safeParse(slot);
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
    });
  });

  it("mockFlashSaleSlots has at least 1 ACTIVE and 1 UPCOMING slot", () => {
    const slots = mockFlashSaleSlots;
    const hasActive = slots.some((s) => s.status === "ACTIVE");
    const hasUpcoming = slots.some((s) => s.status === "UPCOMING");
    expect(hasActive).toBe(true);
    expect(hasUpcoming).toBe(true);
  });

  it("getMockActiveSlot returns a slot with status='ACTIVE'", () => {
    const slot = getMockActiveSlot();
    expect(slot.status).toBe("ACTIVE");
  });

  it("getMockUpcomingSlot returns a slot with status='UPCOMING'", () => {
    const slot = getMockUpcomingSlot();
    expect(slot.status).toBe("UPCOMING");
  });
});

describe("mocks – structure", () => {
  it("active slot has between 8 and 10 items (Stitch shows 10, mock 10)", () => {
    const slot = getMockActiveSlot();
    expect(slot.items.length).toBeGreaterThanOrEqual(8);
    expect(slot.items.length).toBeLessThanOrEqual(10);
  });

  it("upcoming slot has exactly 5 items (Stitch upcoming preview)", () => {
    const slot = getMockUpcomingSlot();
    expect(slot.items).toHaveLength(5);
  });

  it("every item has positive price and discount (originalPrice > flashSalePrice)", () => {
    mockFlashSaleSlots.forEach((slot) => {
      slot.items.forEach((item) => {
        expect(item.flashSalePrice).toBeGreaterThan(0);
        expect(item.originalPrice).toBeGreaterThan(item.flashSalePrice);
      });
    });
  });

  it("active slot has at least 1 'almost-sold-out' item (>90% sold) and 1 'sold-out' item", () => {
    const slot = getMockActiveSlot();
    const items = slot.items;
    const almostSoldOut = items.filter((i) => {
      const sold = i.allocatedStock - i.availableStock;
      const pct = (sold / i.allocatedStock) * 100;
      return pct >= 90 && i.availableStock > 0;
    });
    const soldOut = items.filter((i) => i.availableStock === 0);
    expect(almostSoldOut.length).toBeGreaterThanOrEqual(1);
    expect(soldOut.length).toBeGreaterThanOrEqual(1);
  });
});
