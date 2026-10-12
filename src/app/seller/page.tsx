import { EmptyState } from "@/components/common/EmptyState";

/**
 * Seller Center – Trang tổng quan.
 * Render tại "/seller" (root của seller portal).
 */
export default function SellerOverviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-ink">Tổng quan</h1>
      <p className="text-sm text-ink-2">
        Doanh thu, đơn hàng, tồn kho sẽ hiển thị tại đây.
      </p>
      <EmptyState title="Chưa có dữ liệu" description="Sau khi có đơn hàng đầu tiên, dashboard sẽ tự cập nhật." />
    </div>
  );
}
