"use client";

import React from "react";

interface ReconciliationAnalyticsCardsProps {
  onSignOff?: () => void;
}

export function ReconciliationAnalyticsCards({
  onSignOff,
}: ReconciliationAnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
      {/* Card 1: Revenue Structure */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-xs text-secondary uppercase tracking-wider font-semibold">
              Cấu trúc doanh thu &amp; Hoa hồng
            </span>
            <span className="material-symbols-outlined text-primary text-[18px]">
              pie_chart
            </span>
          </div>
          <div className="font-headline-md text-base font-bold text-on-surface mb-3">
            Tỷ trọng kênh bán hàng
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between font-body-sm text-xs mb-1">
                <span className="text-secondary">Flash Sale sàn (4% - 5%)</span>
                <span className="font-medium text-on-surface font-data-tabular">
                  22,8 tỷ₫ (70%)
                </span>
              </div>
              <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: "70%" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-body-sm text-xs mb-1">
                <span className="text-secondary">Đơn thường shop mall (5%)</span>
                <span className="font-medium text-on-surface font-data-tabular">
                  8,1 tỷ₫ (25%)
                </span>
              </div>
              <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-container h-full rounded-full"
                  style={{ width: "25%" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-body-sm text-xs mb-1">
                <span className="text-secondary">Khác &amp; Phụ phí đối tác</span>
                <span className="font-medium text-on-surface font-data-tabular">
                  1,7 tỷ₫ (5%)
                </span>
              </div>
              <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full"
                  style={{ width: "5%" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-outline-variant/20 flex items-center justify-between font-label-sm text-xs text-secondary">
          <span>Chu kỳ hạch toán tiếp theo</span>
          <span className="font-semibold text-primary">05/10/2026</span>
        </div>
      </div>

      {/* Card 2: Payment Gateways Status */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-xs text-secondary uppercase tracking-wider font-semibold">
              Cổng đối soát thanh toán
            </span>
            <span className="material-symbols-outlined text-primary text-[18px]">
              account_balance
            </span>
          </div>
          <div className="font-headline-md text-base font-bold text-on-surface mb-3">
            Tình trạng kết nối cổng ZaloPay &amp; COD
          </div>

          <div className="space-y-3 font-body-sm text-xs">
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  verified
                </span>
                <div>
                  <div className="font-medium text-on-surface">ZaloPay Merchant API</div>
                  <div className="text-secondary text-[11px]">Khớp sổ tự động 100%</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">
                Hoạt động
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  local_shipping
                </span>
                <div>
                  <div className="font-medium text-on-surface">
                    Đối tác vận chuyển (COD)
                  </div>
                  <div className="text-secondary text-[11px]">
                    GHTK / GHN / SPX Express
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-xs font-semibold">
                Đã nộp COD T+2
              </span>
            </div>
          </div>
        </div>

        <button
          className="w-full mt-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-xs font-semibold flex items-center justify-center gap-1.5"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          <span>Cấu hình cổng thanh toán</span>
        </button>
      </div>

      {/* Card 3: SmartCA Sign-off */}
      <div className="bg-gradient-to-br from-surface-container-low to-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-xs font-semibold uppercase tracking-wider text-primary">
              Biên bản điện tử
            </span>
            <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-bold font-mono">
              Kỳ 09/2026
            </span>
          </div>
          <div className="font-headline-md text-base font-bold text-on-surface mb-2">
            Phê duyệt &amp; Ký số kỳ đối soát
          </div>
          <p className="font-body-sm text-xs text-secondary">
            Biên bản tài chính đã được rà soát nội bộ bởi Kế toán trưởng sàn và sẵn
            sàng để ký số gửi đến 1.420 chủ shop.
          </p>

          <div className="mt-4 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                verified_user
              </span>
              <span className="font-label-md text-xs font-medium text-on-surface">
                Chữ ký số SmartCA
              </span>
            </div>
            <span className="font-label-sm text-xs text-primary font-semibold">
              Đã kích hoạt
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-2">
          <button
            className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary transition-colors font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            onClick={onSignOff}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">draw</span>
            <span>Ký duyệt &amp; Quyết toán</span>
          </button>
          <button
            className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-secondary hover:text-on-surface transition-colors flex items-center justify-center"
            title="Tải văn bản dự thảo PDF"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              picture_as_pdf
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
