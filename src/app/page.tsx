/**
 * Trang chủ Storefront (Stitch "33db6dd859b643bda103e6045378886b").
 * Render tại root "/" sau khi refactor URL sang tiếng Anh.
 *
 * Fix regression (PR #29): page.tsx đã được move ra root app/,
 * nhưng vẫn cần wrap bằng StorefrontHeader + StorefrontFooter + MobileBottomNav
 * để giữ UX storefront nhất quán với các trang khác trong (storefront)/.
 */
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { MobileBottomNav } from "@/components/storefront/MobileBottomNav";
import { HomepageView } from "./_homepage-view";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <StorefrontHeader />
      <div className="flex-1 mx-auto w-full max-w-[1200px] px-4 pb-24 pt-4 md:pb-10">
        <HomepageView />
      </div>
      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
