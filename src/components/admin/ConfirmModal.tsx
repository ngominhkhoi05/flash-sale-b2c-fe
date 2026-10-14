"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ConfirmModalOption {
  value: string;
  label: string;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; note: string; extraCheckbox?: boolean }) => void;
  title: string;
  subtitle?: string;
  icon?: string;
  variant?: "danger" | "warning" | "primary";
  warningMessage?: ReactNode;
  targetSummary?: ReactNode;
  reasonLabel?: string;
  reasonOptions?: ConfirmModalOption[];
  reasonPlaceholder?: string;
  noteLabel?: string;
  notePlaceholder?: string;
  noteRequired?: boolean;
  checkboxLabel?: string;
  confirmButtonText?: string;
  isLoading?: boolean;
}

function ConfirmModalDialog({
  onClose,
  onConfirm,
  title,
  subtitle,
  icon = "gavel",
  variant = "danger",
  warningMessage,
  targetSummary,
  reasonLabel = "Lý do",
  reasonOptions = [],
  reasonPlaceholder = "-- Chọn lý do --",
  noteLabel = "Ghi chú nội bộ",
  notePlaceholder = "Nhập ghi chú chi tiết...",
  noteRequired = false,
  checkboxLabel,
  confirmButtonText = "Xác nhận",
  isLoading = false,
}: Omit<ConfirmModalProps, "isOpen">) {
  const [selectedReason, setSelectedReason] = useState(reasonOptions[0]?.value || "");
  const [noteText, setNoteText] = useState("");
  const [extraCheckbox, setExtraCheckbox] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  function handleSubmit() {
    if (reasonOptions.length > 0 && !selectedReason) {
      setValidationError("Vui lòng chọn lý do.");
      return;
    }
    if (noteRequired && !noteText.trim()) {
      setValidationError("Nội dung giải trình không được để trống.");
      return;
    }
    setValidationError(null);
    onConfirm({ reason: selectedReason, note: noteText, extraCheckbox });
  }

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-[2px] select-none">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden p-space-lg flex flex-col gap-space-md animate-in fade-in zoom-in-95 duration-150 border border-outline-variant/30"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                isDanger
                  ? "bg-error-container text-error"
                  : variant === "warning"
                    ? "bg-warning-soft text-on-warning-soft"
                    : "bg-primary-fixed text-primary"
              )}
            >
              <span className="material-symbols-outlined text-[24px]">
                {icon}
              </span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-headline-lg text-sm font-bold text-on-surface">
                {title}
              </h3>
              {subtitle && (
                <span className="font-body-sm text-xs text-secondary mt-0.5">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Target Summary Pill if any */}
        {targetSummary && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface">
            {targetSummary}
          </div>
        )}

        {/* Warning Callout */}
        {warningMessage && (
          <div
            className={cn(
              "p-3 rounded-lg flex items-start gap-2.5 text-xs text-on-surface",
              isDanger ? "bg-error-container/40" : "bg-warning-soft/60"
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-[20px] shrink-0 mt-0.5",
                isDanger ? "text-error" : "text-warning"
              )}
            >
              warning
            </span>
            <div className="flex-1">{warningMessage}</div>
          </div>
        )}

        {/* Form Inputs */}
        <div className="flex flex-col gap-space-sm text-xs">
          {reasonOptions.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="font-label-md font-semibold text-on-surface">
                {reasonLabel} <span className="text-error">*</span>
              </span>
              <div className="relative w-full">
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg bg-surface-bright font-body-sm text-xs text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/40 cursor-pointer"
                >
                  {reasonPlaceholder && (
                    <option value="" disabled>
                      {reasonPlaceholder}
                    </option>
                  )}
                  {reasonOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md font-semibold text-on-surface">
              {noteLabel}{" "}
              {noteRequired ? <span className="text-error">*</span> : "(Tùy chọn)"}
            </span>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={notePlaceholder}
              rows={3}
              className="w-full p-3 rounded-lg bg-surface-bright font-body-sm text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none border border-outline-variant/40"
            />
          </label>

          {checkboxLabel && (
            <label className="flex items-start gap-2.5 p-1 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={extraCheckbox}
                onChange={(e) => setExtraCheckbox(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
              />
              <span className="font-body-sm text-xs text-on-surface">
                {checkboxLabel}
              </span>
            </label>
          )}

          {validationError && (
            <span className="text-error text-xs font-medium">
              {validationError}
            </span>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-surface-bright hover:bg-surface-container text-on-surface font-label-md text-xs font-medium transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-lg font-label-md text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer text-white",
              isDanger
                ? "bg-error hover:bg-tertiary"
                : "bg-primary hover:bg-primary-hover",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="material-symbols-outlined text-[18px]">
              {icon}
            </span>
            <span>{isLoading ? "Đang xử lý..." : confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal(props: ConfirmModalProps) {
  if (!props.isOpen) return null;
  return <ConfirmModalDialog {...props} />;
}
