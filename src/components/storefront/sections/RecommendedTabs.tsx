"use client";

/**
 * RecommendedTabs – Internal tabs cho RecommendedSection.
 * - 3 tab: "Dành cho bạn" (mặc định), "Bán chạy", "Ưu đãi sốc"
 * - Gọi API /api/v1/products/recommended với tab tương ứng
 */
import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export type RecommendedTab = "forYou" | "bestSellers" | "hotDeals";

export const TAB_TO_API: Record<RecommendedTab, "for_you" | "best_seller" | "hot_deal"> = {
  forYou: "for_you",
  bestSellers: "best_seller",
  hotDeals: "hot_deal",
};

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
      className="bg-surface-container-lowest rounded-xl p-2 shadow-sm flex items-center justify-around sm:justify-start gap-2 border-b border-surface-container"
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
            "px-5 py-2.5 rounded-lg text-label-lg transition-colors flex items-center gap-1.5",
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
