"use client";

import React from "react";

interface SkuBatchActionBarProps {
  selectedCount: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClear: () => void;
}

export function SkuBatchActionBar({
  selectedCount,
  onApproveAll,
  onRejectAll,
  onClear,
}: SkuBatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="w-full bg-[#0F172A] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white shadow-xl transition-all animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs shrink-0">
          ✓
        </span>
        <span className="font-headline-md text-headline-md text-white font-semibold">
          Đã chọn{" "}
          <span className="text-primary-fixed-dim font-bold">
            {selectedCount}
          </span>{" "}
          sản phẩm
        </span>
        <span className="hidden sm:inline text-xs text-slate-400">
          | Sẵn sàng xử lý tự động phân bổ
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onApproveAll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white font-headline-md text-[13px] font-semibold transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">
            task_alt
          </span>
          <span>Duyệt tất cả ({selectedCount})</span>
        </button>
        <button
          type="button"
          onClick={onRejectAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-red-400 hover:text-red-300 font-headline-md text-[13px] font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">block</span>
          <span>Từ chối hàng loạt</span>
        </button>
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white font-label-md text-label-md transition-colors"
        >
          Bỏ chọn
        </button>
      </div>
    </div>
  );
}
