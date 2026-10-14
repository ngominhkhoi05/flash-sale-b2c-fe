import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { MinWidthGuard } from "@/components/common/MinWidthGuard";

/**
 * AdminLayout – Layout Admin Console chuẩn Stitch (chỉ desktop ≥ 1280px).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <MinWidthGuard
      minWidth={1280}
      fallbackMessage="Vui lòng sử dụng màn hình máy tính (≥ 1280px) để truy cập Admin Console."
    >
      <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased">
        <AdminSidebar />
        <div className="pl-60 min-h-screen flex flex-col">
          <AdminTopbar />
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
