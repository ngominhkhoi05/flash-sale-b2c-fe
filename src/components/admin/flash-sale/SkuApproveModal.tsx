"use client";

import React, { useState, useEffect } from "react";

interface SkuApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (commission?: number) => void;
  skuName?: string;
  allocatedStock?: number;
  originalStock?: number;
  isBatch?: boolean;
  batchCount?: number;
}

export function SkuApproveModal({
  isOpen,
  onClose,
  onConfirm,
  skuName = "",
  allocatedStock = 50,
  originalStock = 248,
  isBatch = false,
  batchCount = 0,
}: SkuApproveModalProps) {
  const [commission, setCommission] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setCommission("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const remaining = Math.max(0, originalStock - allocatedStock);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = commission.trim() === "" ? undefined : parseFloat(commission);
    onConfirm(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-fixed text-primary font-bold flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">
                check_circle
              </span>
            </span>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              {isBatch
                ? "Xác nhận duyệt hàng loạt SKU vào Flash Sale"
                : "Xác nhận duyệt SKU vào Flash Sale"}
            </h2>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface flex items-center justify-center transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-5">
            <div>
              <span className="font-label-sm text-label-sm uppercase font-bold text-secondary">
                {isBatch ? "Danh sách duyệt hàng loạt" : "SKU đang xét duyệt"}
              </span>
              <p className="font-headline-md text-headline-md font-semibold text-on-surface mt-0.5">
                {isBatch
                  ? `Đã chọn ${batchCount} sản phẩm sẵn sàng lên kệ Flash Sale`
                  : skuName}
              </p>
            </div>

            {/* Inventory Lock Warning Card */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <span className="text-amber-600 font-bold text-xl leading-none mt-0.5">
                ⚡
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-headline-md text-body-sm font-bold text-amber-950">
                  Khóa tồn kho tự động
                </span>
                <p className="font-body-sm text-body-sm text-amber-900 leading-normal">
                  {isBatch ? (
                    <>
                      Hệ thống sẽ tự động tạm khóa và trừ số lượng đăng ký của{" "}
                      <strong className="font-bold text-amber-950">
                        {batchCount} SKU
                      </strong>{" "}
                      từ kho gốc của các shop tương ứng. Sản phẩm tồn khóa không
                      thể bán thường trong thời gian diễn ra phiên.
                    </>
                  ) : (
                    <>
                      Hệ thống sẽ tạm khóa và trừ{" "}
                      <strong className="font-bold text-amber-950">
                        {allocatedStock} sản phẩm
                      </strong>{" "}
                      từ kho gốc của shop:{" "}
                      <span className="font-mono">
                        {originalStock} → {remaining} khả dụng
                      </span>
                      . Sản phẩm tồn khóa không thể bán thường trong thời gian
                      diễn ra phiên.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Commission Override Form */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-body-md text-body-md font-semibold text-on-surface"
                htmlFor="commissionInput"
              >
                Hoa hồng sàn riêng cho phiên này (tùy chọn)
              </label>
              <div className="relative">
                <input
                  id="commissionInput"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="Ví dụ: 3.5"
                  className="w-full h-11 px-3.5 pr-10 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-headline-md font-semibold text-secondary">
                  %
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-secondary">
                Để trống = kế thừa hoa hồng danh mục hiện tại (5.0%). Phí giao
                dịch sàn không đổi.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-surface-container-low flex items-center justify-end gap-3 border-t border-surface-container/50">
            <button
              type="button"
              className="px-4 py-2 rounded-lg hover:bg-surface-container text-secondary font-headline-md text-body-md font-medium transition-colors"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-white font-headline-md text-body-md font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">
                verified
              </span>
              <span>
                {isBatch
                  ? `Xác nhận duyệt (${batchCount}) SKU`
                  : "Xác nhận duyệt SKU"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
