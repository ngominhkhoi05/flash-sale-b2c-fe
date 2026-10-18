import type { ReactNode } from "react";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { SellerTopbar } from "@/components/seller/SellerTopbar";
import { MinWidthGuard } from "@/components/common/MinWidthGuard";

/**
 * SellerLayout – Layout Seller Center chuẩn Stitch (chỉ desktop ≥ 1280px).
 * Sidebar cố định 240px bên trái, Topbar cố định 64px phía trên.
 */
export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <MinWidthGuard
      minWidth={1280}
      fallbackMessage="Vui lòng sử dụng màn hình máy tính (≥ 1280px) để truy cập Kênh Người Bán (Seller Center)."
    >
      <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased">
        <SellerSidebar />
        <div className="pl-60 min-h-screen flex flex-col">
          <SellerTopbar />
          <main className="relative pt-16 bg-surface min-h-screen flex-1">
            <div className="w-full px-space-lg lg:px-margin py-space-lg max-w-[1440px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MinWidthGuard>
  );
}
