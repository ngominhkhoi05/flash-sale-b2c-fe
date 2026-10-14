"use client";

import React, { useState } from "react";

interface EmergencyPauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => void;
  sessionName?: string;
}

const EMERGENCY_REASONS = [
  "Tải hệ thống vượt ngưỡng (P99 > 1000ms)",
  "Phát hiện nghi vấn botnet / tấn công chuỗi",
  "Sự cố kết nối cổng thanh toán đối tác",
  "Lệch tồn kho bất thường giữa Redis và DB",
  "Khác",
];

export function EmergencyPauseModal({
  isOpen,
  onClose,
  onConfirm,
  sessionName = "Giờ Vàng 12:00",
}: EmergencyPauseModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(
    EMERGENCY_REASONS[0]
  );
  const [note, setNote] = useState<string>("");

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedReason(EMERGENCY_REASONS[0]);
    setNote("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedReason, note.trim());
    setSelectedReason(EMERGENCY_REASONS[0]);
    setNote("");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-rose-200">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 flex items-center justify-between border-b border-rose-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">
                warning
              </span>
            </span>
            <h2 className="font-headline-md text-headline-md font-bold text-rose-950">
              Tạm dừng phiên khẩn cấp
            </h2>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg hover:bg-rose-100 text-rose-800 flex items-center justify-center transition-colors"
            onClick={handleClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-body-sm space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-700 text-body-md">
                <span className="material-symbols-outlined text-[18px]">
                  gpp_maybe
                </span>
                Cảnh báo vận hành mức độ cao
              </span>
              <p className="leading-relaxed">
                Hành động này sẽ <strong>khóa cổng đặt hàng ngay lập tức</strong> cho phiên{" "}
                <span className="font-semibold underline">{sessionName}</span>.
                Người dùng đang thao tác sẽ nhận thông báo hệ thống bảo trì và không
                thể thanh toán thêm.
              </p>
            </div>

            {/* Select Reason */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-body-md text-body-md font-semibold text-on-surface"
                htmlFor="emergencyReasonSelect"
              >
                Lý do kích hoạt tạm dừng khẩn cấp:
              </label>
              <select
                id="emergencyReasonSelect"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              >
                {EMERGENCY_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional note */}
            <div className="flex flex-col gap-1.5">
              <label
                className="font-body-md text-body-md font-semibold text-on-surface"
                htmlFor="emergencyNote"
              >
                Ghi chú nội bộ cho SRE / Ban Quản Trị (tùy chọn):
              </label>
              <textarea
                id="emergencyNote"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Tạm dừng trong 5 phút để restart Redis cluster..."
                className="w-full p-3 rounded-lg bg-surface-bright font-body-md text-body-md text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-surface-container-low flex items-center justify-end gap-3 border-t border-surface-container/50">
            <button
              type="button"
              className="px-4 py-2 rounded-lg hover:bg-surface-container text-secondary font-headline-md text-body-md font-medium transition-colors"
              onClick={handleClose}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-headline-md text-body-md font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">
                pause_circle
              </span>
              <span>Xác nhận Tạm dừng phiên</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
