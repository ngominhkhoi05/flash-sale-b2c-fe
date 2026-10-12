/**
 * HomepageView – Trang chủ Storefront theo Stitch "33db6dd859b643bda103e6045378886b".
 *
 * Compose 7 sections:
 * 1. HeroBannerSection
 * 2. QuickActionsSection
 * 3. CategoryGridSection
 * 4. FlashSaleStripSection
 * 5. VoucherGridSection
 * 6. FeaturedStoresSection
 * 7. RecommendedSection
 *
 * Server Component (default) – các section có state đã tự thêm 'use client'.
 */
import { HeroBannerSection } from "@/components/storefront/sections/HeroBannerSection";
import { QuickActionsSection } from "@/components/storefront/sections/QuickActionsSection";
import { CategoryGridSection } from "@/components/storefront/sections/CategoryGridSection";
import { FlashSaleStripSection } from "@/components/storefront/sections/FlashSaleStripSection";
import { VoucherGridSection } from "@/components/storefront/sections/VoucherGridSection";
import { FeaturedStoresSection } from "@/components/storefront/sections/FeaturedStoresSection";
import { RecommendedSection } from "@/components/storefront/sections/RecommendedSection";

export function HomepageView() {
  return (
    <div className="w-full bg-surface space-y-6">
      <HeroBannerSection />
      <QuickActionsSection />
      <CategoryGridSection />
      <FlashSaleStripSection />
      <VoucherGridSection />
      <FeaturedStoresSection />
      <RecommendedSection />
    </div>
  );
}
