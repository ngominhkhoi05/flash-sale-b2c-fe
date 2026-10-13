import { describe, expect, it } from "vitest";
import { formatVNDCompact } from "./format";

describe("formatVNDCompact", () => {
  it("renders <1k as plain number", () => {
    expect(formatVNDCompact(0)).toBe("0");
    expect(formatVNDCompact(500)).toBe("500");
    expect(formatVNDCompact(999)).toBe("999");
  });

  it("renders 1k–999k with k suffix and decimal if needed", () => {
    expect(formatVNDCompact(1_000)).toBe("1k");
    expect(formatVNDCompact(1_500)).toBe("1,5k");
    expect(formatVNDCompact(12_300)).toBe("12,3k");
    expect(formatVNDCompact(999_999)).toBe("999,9k");
  });

  it("renders 1M+ as M with decimal if needed", () => {
    expect(formatVNDCompact(1_000_000)).toBe("1tr");
    expect(formatVNDCompact(1_290_000)).toBe("1,29tr");
    expect(formatVNDCompact(12_500_000)).toBe("12,5tr");
  });

  it("accepts string input", () => {
    expect(formatVNDCompact("1500000")).toBe("1,5tr");
  });
});
