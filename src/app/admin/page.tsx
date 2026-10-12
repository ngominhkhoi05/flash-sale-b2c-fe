import { EmptyState } from "@/components/common/EmptyState";

/**
 * Admin Console – Trang tổng quan.
 * Render tại "/admin" (root của admin portal).
 */
export default function AdminOverviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-ink">Tổng quan</h1>
      <p className="text-sm text-ink-2">
        Thống kê người dùng, shop, đơn hàng sẽ hiển thị tại đây.
      </p>
      <EmptyState title="Chưa có dữ liệu" />
    </div>
  );
}
