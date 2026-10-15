"use client";

import React from "react";
import { ReconciliationRefund } from "@/types/reconciliation";

interface ReconciliationRefundsTableProps {
  refunds: ReconciliationRefund[];
  onViewRefund?: (item: ReconciliationRefund) => void;
}

export function ReconciliationRefundsTable({
  refunds,
  onViewRefund,
}: ReconciliationRefundsTableProps) {
  return (
    <div className="flex flex-col gap-space-md">
      {/* Subheader banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="h-8 w-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[18px]">
              currency_exchange
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-base text-on-surface font-bold">
              Đối soát hoàn tiền kỳ này
            </h3>
            <span className="font-body-sm text-xs text-secondary">
              Giao dịch hoàn tiền khách hàng tổng giá trị <strong>84,2 triệu₫</strong>{" "}
              (142 yêu cầu)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs font-label-md text-xs text-secondary">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low text-tertiary font-semibold border border-tertiary/20">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
            Thu hồi hoa hồng sàn tương ứng: 4.210.000₫
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="h-11 bg-surface-container-low text-secondary font-label-sm text-xs uppercase tracking-wider border-b border-outline-variant/30 select-none">
                <th className="px-space-md font-semibold">Mã đơn</th>
                <th className="px-space-md font-semibold">Khách hàng</th>
                <th className="px-space-md font-semibold text-right">Số tiền hoàn (₫)</th>
                <th className="px-space-md font-semibold">Lý do hoàn</th>
                <th className="px-space-md font-semibold font-mono">Mã GD ZaloPay</th>
                <th className="px-space-md font-semibold">Thời điểm hoàn</th>
                <th className="px-space-md font-semibold">Trạng thái</th>
                <th className="px-space-md font-semibold text-center w-16">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-md text-sm">
              {refunds.map((refund) => (
                <tr
                  className="h-14 hover:bg-surface-container-low/40 transition-colors"
                  key={refund.id}
                >
                  <td className="px-space-md font-medium text-primary">
                    <span className="font-mono font-semibold text-xs text-primary">
                      {refund.orderCode}
                    </span>
                  </td>

                  <td className="px-space-md">
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface text-xs">
                        {refund.customerName}
                      </span>
                      <span className="text-[11px] text-secondary font-mono">
                        {refund.customerPhone}
                      </span>
                    </div>
                  </td>

                  <td className="px-space-md text-right font-data-tabular font-bold text-tertiary text-sm">
                    {refund.refundAmount.toLocaleString("vi-VN")}₫
                  </td>

                  <td className="px-space-md">
                    <span className="inline-flex items-center gap-1.5 text-on-surface text-xs font-medium">
                      <span className="material-symbols-outlined text-[15px] text-tertiary">
                        cancel
                      </span>
                      {refund.reason}
                    </span>
                  </td>

                  <td className="px-space-md">
                    <span className="font-mono text-xs bg-surface-container px-2 py-0.5 rounded text-on-surface font-medium">
                      {refund.transactionCode}
                    </span>
                  </td>

                  <td className="px-space-md text-secondary font-data-tabular text-xs">
                    {refund.refundedAt}
                  </td>

                  <td className="px-space-md">
                    {refund.status === "REFUNDED_WALLET" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-fixed">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Đã hoàn ví ZP
                      </span>
                    ) : refund.status === "REFUNDED_ATM" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-fixed">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Đã hoàn thẻ ATM
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-highest text-secondary">
                        <span className="h-1.5 w-1.5 rounded-full bg-outline animate-spin" />
                        Đang xử lý ngân hàng
                      </span>
                    )}
                  </td>

                  <td className="px-space-md text-center">
                    <button
                      className="h-8 w-8 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface flex items-center justify-center mx-auto transition-colors"
                      onClick={() => onViewRefund?.(refund)}
                      title="Xem chứng từ hoàn tiền"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        receipt
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
