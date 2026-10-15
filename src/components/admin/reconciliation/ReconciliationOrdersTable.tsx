"use client";

import React from "react";
import { ReconciliationOrder } from "@/types/reconciliation";

interface ReconciliationOrdersTableProps {
  orders: ReconciliationOrder[];
  totalCount: number;
  totals: {
    totalAmountSum: number;
    platformFeeSum: number;
    shopEarningsSum: number;
    averageCommission: number;
  };
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  onViewOrder: (order: ReconciliationOrder) => void;
}

export function ReconciliationOrdersTable({
  orders,
  totalCount,
  totals,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewOrder,
}: ReconciliationOrdersTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1080px]">
          <thead>
            <tr className="h-11 bg-surface-container-low text-secondary font-label-sm text-xs uppercase tracking-wider border-b border-outline-variant/30 select-none">
              <th className="px-space-md font-semibold">Mã đơn hàng</th>
              <th className="px-space-md font-semibold">Ngày chốt</th>
              <th className="px-space-md font-semibold">Gian hàng đối tác</th>
              <th className="px-space-md font-semibold">Thanh toán</th>
              <th className="px-space-md font-semibold text-right">Tổng tiền đơn (₫)</th>
              <th className="px-space-md font-semibold text-center">Tỉ lệ HH (%)</th>
              <th className="px-space-md font-semibold text-right">Phí sàn thu (₫)</th>
              <th className="px-space-md font-semibold text-right">Shop thực nhận (₫)</th>
              <th className="px-space-md font-semibold">Trạng thái đối soát</th>
              <th className="px-space-md font-semibold text-center w-16">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-md text-sm">
            {orders.length === 0 ? (
              <tr>
                <td className="px-space-md py-12 text-center text-secondary" colSpan={10}>
                  Không có dữ liệu đối soát phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  className="h-14 hover:bg-surface-container-low/40 transition-colors"
                  key={order.id}
                >
                  <td className="px-space-md font-medium text-primary">
                    <button
                      className="hover:underline flex items-center gap-1 font-mono font-semibold text-sm"
                      onClick={() => onViewOrder(order)}
                      type="button"
                    >
                      <span>{order.orderCode}</span>
                      <span className="material-symbols-outlined text-[14px]">
                        open_in_new
                      </span>
                    </button>
                  </td>

                  <td className="px-space-md text-secondary font-data-tabular text-xs">
                    {order.settlementDate}
                  </td>

                  <td className="px-space-md">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center font-bold text-[10px] text-primary">
                        {order.storeInitials}
                      </div>
                      <span className="font-medium text-on-surface text-xs">
                        {order.storeName}
                      </span>
                    </div>
                  </td>

                  <td className="px-space-md">
                    {order.paymentMethod === "ZALOPAY" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-primary-fixed text-on-primary-fixed-variant">
                        <span className="material-symbols-outlined text-[13px]">
                          qr_code_2
                        </span>
                        ZaloPay QR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-surface-container text-secondary">
                        <span className="material-symbols-outlined text-[13px]">
                          local_shipping
                        </span>
                        COD Tiền mặt
                      </span>
                    )}
                  </td>

                  <td className="px-space-md text-right font-data-tabular font-medium text-on-surface text-sm">
                    {order.totalAmount.toLocaleString("vi-VN")}₫
                  </td>

                  <td className="px-space-md text-center">
                    {order.isCustomRate ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-xs font-semibold text-primary"
                        title="Thỏa thuận riêng gian hàng"
                      >
                        <span>{order.commissionRate}% · riêng shop</span>
                        <span className="material-symbols-outlined text-[12px]">
                          edit
                        </span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-xs text-secondary font-medium">
                        {order.commissionRate}% (mặc định)
                      </span>
                    )}
                  </td>

                  <td className="px-space-md text-right font-data-tabular font-semibold text-primary text-sm">
                    {order.platformFee.toLocaleString("vi-VN")}₫
                  </td>

                  <td className="px-space-md text-right font-data-tabular font-bold text-on-surface text-sm">
                    {order.shopEarnings.toLocaleString("vi-VN")}₫
                  </td>

                  <td className="px-space-md">
                    {order.status === "SETTLED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-fixed">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Đã ghi sổ ví
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-highest text-secondary">
                        <span className="h-1.5 w-1.5 rounded-full bg-outline" />
                        Chờ giao hàng
                      </span>
                    )}
                  </td>

                  <td className="px-space-md text-center">
                    <button
                      className="h-8 w-8 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface flex items-center justify-center mx-auto transition-colors"
                      onClick={() => onViewOrder(order)}
                      title="Chi tiết đơn"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        more_horiz
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Dynamic Summary Row In Footer */}
          {orders.length > 0 && (
            <tfoot>
              <tr className="h-14 bg-surface-container text-sm text-on-surface font-semibold border-t-2 border-primary/20 select-none">
                <td className="px-space-md" colSpan={4}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      calculate
                    </span>
                    <span>
                      Tổng cộng {orders.length} đơn hiển thị (trên{" "}
                      {totalCount.toLocaleString("vi-VN")} đơn kỳ này)
                    </span>
                  </div>
                </td>
                <td className="px-space-md text-right font-data-tabular text-on-surface">
                  {totals.totalAmountSum.toLocaleString("vi-VN")}₫
                </td>
                <td className="px-space-md text-center text-secondary text-xs">
                  Trung bình ~{totals.averageCommission}%
                </td>
                <td className="px-space-md text-right font-data-tabular text-primary">
                  {totals.platformFeeSum.toLocaleString("vi-VN")}₫
                </td>
                <td className="px-space-md text-right font-data-tabular text-on-surface font-bold text-[15px]">
                  {totals.shopEarningsSum.toLocaleString("vi-VN")}₫
                </td>
                <td className="px-space-md text-right text-xs text-secondary" colSpan={2}>
                  Tỷ lệ đối soát:{" "}
                  <span className="text-primary font-bold">100% khớp sổ</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm bg-surface-container-lowest border-t border-outline-variant/20 text-xs text-secondary">
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <select
            className="h-8 px-2 rounded bg-surface-container-low border-0 text-on-surface text-xs focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(0);
            }}
            value={pageSize}
          >
            <option value={5}>5 hàng</option>
            <option value={10}>10 hàng</option>
            <option value={20}>20 hàng</option>
            <option value={50}>50 hàng</option>
          </select>
          <span>trong tổng số {totalCount.toLocaleString("vi-VN")} giao dịch</span>
        </div>

        <div className="flex items-center gap-1 font-label-md">
          <button
            className="h-8 px-2.5 rounded bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container flex items-center justify-center disabled:opacity-50"
            disabled={page === 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>

          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => (
            <button
              className={`h-8 w-8 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                page === idx
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
              key={idx}
              onClick={() => onPageChange(idx)}
              type="button"
            >
              {idx + 1}
            </button>
          ))}

          {totalPages > 5 && <span className="px-1 text-secondary">...</span>}

          <button
            className="h-8 px-2.5 rounded bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container flex items-center justify-center disabled:opacity-50"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
