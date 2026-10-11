import type { ReactNode } from "react";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { MobileBottomNav } from "@/components/storefront/MobileBottomNav";
import { StorefrontShell } from "./_shell";

/**
 * Layout Storefront (rule §2).
 * - Header sticky (Stitch 2-tầng)
 * - MobileBottomNav fixed bottom
 * - Footer bên dưới content từng trang
 *
 * Lưu ý: Trang chủ (HomepageView) tự wrap <main> + padding.
 * Trang khác (vd /flash-sale, /san-pham/[slug]) sử dụng default centered max-w-[1200px].
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StorefrontShell>
        <StorefrontHeader />
        <div className="flex-1 mx-auto w-full max-w-[1200px] px-4 pb-24 pt-4 md:pb-10">
          {children}
        </div>
        <StorefrontFooter />
      </StorefrontShell>
      <MobileBottomNav />
    </>
  );
}
