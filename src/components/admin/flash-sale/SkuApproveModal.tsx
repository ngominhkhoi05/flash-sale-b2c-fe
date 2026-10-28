"use client";

import React, { useState } from "react";

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
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const remaining = Math.max(0, originalStock - allocatedStock);

  const handleClose = () => {
    setCommission("");
    setError("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commission.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tỷ lệ hoa hồng sàn cho phiên này");
      return;
    }
    const val = parseFloat(trimmed);
    if (isNaN(val) || val <= 0 || val > 100) {
      setError("Tỷ lệ hoa hồng không hợp lệ (phải từ 0.1% đến 100%)");
      return;
    }

    setCommission("");
    setError("");
    onConfirm(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
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
            onClick={handleClose}
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

            {/* Commission Input Form */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-body-md text-body-md font-semibold text-on-surface flex items-center justify-between"
                htmlFor="commissionInput"
              >
                <span>
                  Hoa hồng sàn áp dụng cho phiên này <span className="text-rose-500 font-bold">*</span>
                </span>
              </label>
              <div className="relative">
                <input
                  id="commissionInput"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  required
                  value={commission}
                  onChange={(e) => {
                    setCommission(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Ví dụ: 5.0"
                  className={`w-full h-11 px-3.5 pr-10 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border ${
                    error ? "border-rose-500 ring-1 ring-rose-500" : "border-outline-variant/30"
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-headline-md font-semibold text-secondary">
                  %
                </span>
              </div>
              {error ? (
                <span className="font-body-sm text-body-sm text-rose-600 font-medium">
                  {error}
                </span>
              ) : (
                <span className="font-body-sm text-body-sm text-secondary">
                  Bắt buộc nhập tỷ lệ hoa hồng sàn áp dụng (0.1% - 100%). Phí giao dịch sàn giữ nguyên.
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-surface-container-low flex items-center justify-end gap-3 border-t border-surface-container/50">
            <button
              type="button"
              className="px-4 py-2 rounded-lg hover:bg-surface-container text-secondary font-headline-md text-body-md font-medium transition-colors"
              onClick={handleClose}
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
