"use client";

import React, { useState, useEffect } from "react";

interface SkuRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => void;
  skuName?: string;
  isBatch?: boolean;
  batchCount?: number;
}

const REASON_CHIPS = [
  "Giá chưa hấp dẫn (<40%)",
  "Ảnh không đạt chuẩn bìa",
  "Tồn kho không đủ hạn mức",
  "Trùng ngành hàng cùng khung giờ",
  "Khác",
];

export function SkuRejectModal({
  isOpen,
  onClose,
  onConfirm,
  skuName = "",
  isBatch = false,
  batchCount = 0,
}: SkuRejectModalProps) {
  const [selectedChip, setSelectedChip] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setSelectedChip("");
      setNote("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChipClick = (chip: string) => {
    setSelectedChip(chip);
    setError("");
    if (chip === "Khác") {
      if (!note) {
        setNote("Lý do khác: ");
      }
    } else {
      setNote(`${chip}: Vui lòng tối ưu lại theo tiêu chuẩn quy chế phiên.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Vui lòng cung cấp lý do chi tiết để gửi cho Người Bán.");
      return;
    }
    const finalReason = selectedChip || "Từ chối theo quy chế sàn";
    onConfirm(finalReason, note.trim());
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
        <div className="px-6 py-4 bg-rose-50 flex items-center justify-between border-b border-rose-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">
                cancel
              </span>
            </span>
            <h2 className="font-headline-md text-headline-md font-bold text-rose-950">
              {isBatch
                ? `Từ chối hàng loạt (${batchCount}) SKU`
                : "Từ chối SKU vào phiên Flash Sale"}
            </h2>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg hover:bg-rose-100 text-rose-800 flex items-center justify-center transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-4">
            <div>
              <span className="font-label-sm text-label-sm uppercase font-bold text-secondary">
                {isBatch ? "Danh sách từ chối hàng loạt" : "SKU bị từ chối"}
              </span>
              <p className="font-headline-md text-headline-md font-semibold text-on-surface mt-0.5">
                {isBatch
                  ? `Đang áp dụng từ chối cho ${batchCount} sản phẩm đã chọn`
                  : skuName}
              </p>
            </div>

            {/* Quick Reason Selection Chips */}
            <div className="flex flex-col gap-2">
              <span className="font-body-md text-body-md font-semibold text-on-surface">
                Chọn nhanh lý do chính:
              </span>
              <div className="flex flex-wrap gap-2">
                {REASON_CHIPS.map((chip) => {
                  const isSelected = selectedChip === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm transition-colors ${
                        isSelected
                          ? "bg-rose-200 text-rose-900 font-semibold ring-1 ring-rose-400"
                          : "bg-surface-container-low text-on-surface hover:bg-rose-50 hover:text-rose-900"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Textarea */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label
                className="font-body-md text-body-md font-semibold text-on-surface flex items-center justify-between"
                htmlFor="rejectReasonDetails"
              >
                <span>
                  Lý do chi tiết &amp; hướng dẫn điều chỉnh{" "}
                  <span className="text-tertiary-container font-bold">*</span>
                </span>
              </label>
              <textarea
                id="rejectReasonDetails"
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Thông điệp này sẽ được gửi trực tiếp qua Kênh Người Bán và Notification App..."
                className={`w-full p-3 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? "ring-2 ring-rose-500 border border-rose-500"
                    : "focus:ring-rose-500/30"
                }`}
              />
              {error ? (
                <span className="font-label-sm text-label-sm text-rose-600 font-medium">
                  {error}
                </span>
              ) : (
                <span className="font-label-sm text-label-sm text-secondary">
                  Bắt buộc cung cấp lý do minh bạch theo Quy định vận hành sàn
                  2026.
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-surface-container-low flex items-center justify-end gap-3 border-t border-surface-container/50">
            <button
              type="button"
              className="px-4 py-2 rounded-lg hover:bg-surface-container text-secondary font-headline-md text-body-md font-medium transition-colors"
              onClick={onClose}
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-tertiary-container hover:bg-tertiary text-white font-headline-md text-body-md font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">
                block
              </span>
              <span>
                {isBatch
                  ? `Từ chối (${batchCount}) đăng ký`
                  : "Từ chối đăng ký"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
