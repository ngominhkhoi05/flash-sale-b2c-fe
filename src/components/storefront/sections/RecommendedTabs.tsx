"use client";

/**
 * RecommendedTabs – Internal tabs cho RecommendedSection.
 * - 3 tab: "Dành cho bạn" (mặc định), "Bán chạy", "Ưu đãi sốc"
 * - Sticky dưới flash sale strip + vouchers
 * - Logic: filter products theo activeTab
 */
import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { RecommendedProduct } from "./home-mocks";

export type RecommendedTab = "forYou" | "bestSellers" | "hotDeals";

interface RecommendedTabsProps {
  activeTab: RecommendedTab;
  onTabChange: (tab: RecommendedTab) => void;
  t: (key: string) => string;
}

const TABS: { key: RecommendedTab; labelKey: string; icon: Parameters<typeof MaterialSymbol>[0]["name"] }[] = [
  { key: "forYou", labelKey: "recommended.tabForYou", icon: "recommend" },
  { key: "bestSellers", labelKey: "recommended.tabBestSellers", icon: "trending_up" },
  { key: "hotDeals", labelKey: "recommended.tabHotDeals", icon: "price_check" },
];

export function RecommendedTabs({ activeTab, onTabChange, t }: RecommendedTabsProps) {
  return (
    <div
      className="sticky top-20 z-30 bg-surface-container-lowest rounded-xl p-2 shadow-sm flex items-center justify-around sm:justify-start gap-2 border-b border-surface-container"
      role="tablist"
      aria-label="Recommended product tabs"
    >
      {TABS.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          data-testid={`tab-${tab.key}`}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "px-5 py-2.5 rounded-lg font-label-lg text-label-lg transition-colors flex items-center gap-1.5",
            activeTab === tab.key
              ? "bg-primary text-on-primary font-bold shadow-sm"
              : "bg-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
          )}
        >
          <MaterialSymbol name={tab.icon} size="lg" />
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}

/**
 * Filter products theo active tab.
 * - forYou: trả về tất cả
 * - bestSellers: filter theo soldCount >= 1000 (proxy)
 * - hotDeals: chỉ những sản phẩm có discountPercent > 0
 */
export function filterProductsByTab(
  products: RecommendedProduct[],
  tab: RecommendedTab
): RecommendedProduct[] {
  if (tab === "bestSellers") {
    return products.filter((p) => parseSoldCount(p.soldCount) >= 1000);
  }
  if (tab === "hotDeals") {
    return products.filter((p) => p.discountPercent && p.discountPercent > 0);
  }
  return products;
}

/**
 * Parse "5,6k" / "1,2k" / "890" → number.
 * Examples:
 * - "890" → 890
 * - "1,2k" → 1200
 * - "5,6k" → 5600
 * - "12,3k" → 12300
 */
export function parseSoldCount(raw: string): number {
  const normalized = raw.replace(",", ".").trim();
  if (normalized.endsWith("k")) {
    const num = parseFloat(normalized.slice(0, -1));
    return Number.isFinite(num) ? num * 1000 : 0;
  }
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
}
