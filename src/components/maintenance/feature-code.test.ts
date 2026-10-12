import { describe, it, expect } from "vitest";
import {
  getMaintenanceFeatureLabel,
  type SupportedLocale,
} from "./feature-code";
import {
  isMaintenanceFeatureCode,
  MAINTENANCE_FEATURE_CODES,
} from "@/lib/constants";

describe("getMaintenanceFeatureLabel", () => {
  it("returns Vietnamese label for known code", () => {
    expect(
      getMaintenanceFeatureLabel(MAINTENANCE_FEATURE_CODES.DOWNLOAD_APP, "vi"),
    ).toBe("Tính năng tải ứng dụng");
    expect(
      getMaintenanceFeatureLabel(MAINTENANCE_FEATURE_CODES.CATEGORY, "vi"),
    ).toBe("Danh mục sản phẩm");
  });

  it("returns English label for known code", () => {
    expect(
      getMaintenanceFeatureLabel(MAINTENANCE_FEATURE_CODES.DOWNLOAD_APP, "en"),
    ).toBe("Download app feature");
    expect(
      getMaintenanceFeatureLabel(MAINTENANCE_FEATURE_CODES.NOTIFICATIONS, "en"),
    ).toBe("Notifications center");
  });

  it("returns null for null/undefined code", () => {
    expect(getMaintenanceFeatureLabel(null, "vi")).toBeNull();
    expect(getMaintenanceFeatureLabel(undefined, "vi")).toBeNull();
  });

  it("returns null for invalid code (not in enum)", () => {
    expect(getMaintenanceFeatureLabel("not-a-code", "vi")).toBeNull();
    expect(getMaintenanceFeatureLabel("", "vi")).toBeNull();
    expect(getMaintenanceFeatureLabel("REVIEW:CREATE", "vi")).toBeNull();
  });

  it("falls back to Vietnamese for unsupported locale", () => {
    // Cast qua `unknown` để simulate runtime gọi với locale không hỗ trợ.
    // Helper vẫn fallback về `vi` (xem implementation).
    const label = getMaintenanceFeatureLabel(
      MAINTENANCE_FEATURE_CODES.BEST_SELLERS,
      "fr" as unknown as "vi",
    );
    expect(label).toBe("Trang Sản phẩm bán chạy");
  });

  it("covers all 16 maintenance feature codes", () => {
    const codes = Object.values(MAINTENANCE_FEATURE_CODES);
    expect(codes).toHaveLength(16);
    codes.forEach((code) => {
      expect(getMaintenanceFeatureLabel(code, "vi")).toBeTruthy();
      expect(getMaintenanceFeatureLabel(code, "en")).toBeTruthy();
    });
  });
});

describe("isMaintenanceFeatureCode (type guard)", () => {
  it("returns true for known code", () => {
    expect(isMaintenanceFeatureCode("download-app")).toBe(true);
    expect(isMaintenanceFeatureCode("category")).toBe(true);
  });

  it("returns false for unknown / null / undefined", () => {
    expect(isMaintenanceFeatureCode("xyz")).toBe(false);
    expect(isMaintenanceFeatureCode(null)).toBe(false);
    expect(isMaintenanceFeatureCode(undefined)).toBe(false);
  });
});

describe("SupportedLocale type", () => {
  it("accepts 'vi' and 'en'", () => {
    const vi: SupportedLocale = "vi";
    const en: SupportedLocale = "en";
    expect(vi).toBe("vi");
    expect(en).toBe("en");
  });
});
