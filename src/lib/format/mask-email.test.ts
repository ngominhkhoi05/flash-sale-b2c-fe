import { describe, expect, it } from "vitest";
import { maskEmail } from "./mask-email";

describe("maskEmail", () => {
  it("mask email thường: 2 ký tự đầu + *** + domain", () => {
    expect(maskEmail("an.nguyen@gmail.com")).toBe("an***@gmail.com");
  });

  it("email ngắn (< 2 ký tự trước @): giữ nguyên local", () => {
    expect(maskEmail("a@example.com")).toBe("a***@example.com");
  });

  it("email rỗng: trả về rỗng", () => {
    expect(maskEmail("")).toBe("");
  });

  it("email không có @: trả về nguyên văn", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });

  it("email có @ ở đầu: trả về nguyên văn", () => {
    expect(maskEmail("@example.com")).toBe("@example.com");
  });
});
