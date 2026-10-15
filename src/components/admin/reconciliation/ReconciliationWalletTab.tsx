"use client";

import React from "react";

export function ReconciliationWalletTab() {
  return (
    <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-3">
        <span className="material-symbols-outlined text-[36px]">
          account_balance_wallet
        </span>
      </div>
      <h3 className="font-headline-md text-lg font-bold text-on-surface">
        Nhật ký chuyển khoản Ví người bán
      </h3>
      <p className="font-body-sm text-sm text-secondary mt-1.5 max-w-md">
        Tất cả lệnh rút tiền tự động qua cổng NAPAS 24/7 và quyết toán số dư khả dụng
        kỳ 09/2026 đang được hệ thống đồng bộ ngầm.
      </p>

      <div className="flex items-center gap-2 mt-6">
        <button
          className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-xs font-semibold flex items-center gap-1.5"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px] text-secondary">
            history
          </span>
          <span>Xem lệnh payout gần nhất</span>
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md text-xs font-semibold flex items-center gap-1.5"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">
            verified_user
          </span>
          <span>Kiểm tra cổng NAPAS</span>
        </button>
      </div>
    </div>
  );
}
