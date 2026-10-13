"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * OtpInput – 6 ô input cho mã OTP, mỗi ô 1 chữ số.
 *
 * Pattern:
 *  - Controlled (value: string, onChange: (v: string) => void).
 *  - Auto-focus ô đầu khi mount.
 *  - Nhập 1 số → tự nhảy sang ô sau; Backspace trên ô rỗng → focus ô trước.
 *  - Paste "123456" → fill all 6 ô + auto focus ô cuối.
 *  - Hỗ trợ error state (ô border đỏ).
 *  - forwardRef để parent có thể clear/select.
 *
 * Stitch spec:
 *  - Kích thước: 48×56 (w-12 h-14)
 *  - Border: 1px (default) / 2px (focus/error)
 *  - Ring focus: 4px primary-soft (#cce5ff)
 *  - Font: text-2xl font-semibold
 *  - Caret blink: 1s animation
 */
export interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  hasError?: boolean;
  disabled?: boolean;
  /** id prefix cho từng ô (mặc định "otp"). */
  idPrefix?: string;
  className?: string;
  /** Auto focus khi mount (mặc định true). */
  autoFocus?: boolean;
}

export interface OtpInputRef {
  focus: (index?: number) => void;
  clear: () => void;
}

const DEFAULT_LENGTH = 6;
const DEFAULT_ID_PREFIX = "otp";

export const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(function OtpInput(
  {
    value,
    onChange,
    length = DEFAULT_LENGTH,
    hasError = false,
    disabled = false,
    idPrefix = DEFAULT_ID_PREFIX,
    className,
    autoFocus = true,
  },
  ref
) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  // Track focus index để render cursor blink trên ô đang focus
  const [focusIndex, setFocusIndex] = useState<number>(autoFocus ? 0 : -1);

  useImperativeHandle(ref, () => ({
    focus: (idx: number = 0) => {
      const target = inputRefs.current[idx];
      target?.focus();
    },
    clear: () => {
      onChange("");
      inputRefs.current[0]?.focus();
    },
  }));

  const setRef = (idx: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[idx] = el;
  };

  function updateAt(idx: number, digit: string) {
    if (disabled) return;
    const arr = value.padEnd(length, " ").split("");
    arr[idx] = digit;
    const next = arr.join("").replace(/ /g, "").slice(0, length);
    onChange(next);
  }

  function handleChange(idx: number, raw: string) {
    // Chỉ chấp nhận 1 chữ số
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    updateAt(idx, digit);
    // Auto-advance
    if (idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace") {
      const arr = value.padEnd(length, " ").split("");
      if (arr[idx]?.trim() === "") {
        // Ô rỗng → focus ô trước + xoá ô đó
        if (idx > 0) {
          inputRefs.current[idx - 1]?.focus();
          arr[idx - 1] = " ";
          const next = arr.join("").replace(/ /g, "").slice(0, length);
          onChange(next);
          e.preventDefault();
        }
      } else {
        // Ô có giá trị → xoá
        arr[idx] = " ";
        const next = arr.join("").replace(/ /g, "").slice(0, length);
        onChange(next);
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
      e.preventDefault();
    } else if (e.key === "Home") {
      inputRefs.current[0]?.focus();
      e.preventDefault();
    } else if (e.key === "End") {
      inputRefs.current[length - 1]?.focus();
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    // Focus ô cuối (hoặc ô kế tiếp nếu paste đầy)
    const focusTarget = Math.min(pasted.length, length - 1);
    inputRefs.current[focusTarget]?.focus();
  }

  function handleFocus(idx: number) {
    setFocusIndex(idx);
  }

  function handleBlur() {
    // Không reset focusIndex ngay để cursor blink không nhảy khi click giữa các ô
    // (chỉ reset khi click ra ngoài hoàn toàn – xử lý bằng relatedTarget)
  }

  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      role="group"
      aria-label="OTP input"
      data-testid="otp-input-group"
    >
      {Array.from({ length }).map((_, idx) => {
        const arr = value.padEnd(length, " ").split("");
        const char = arr[idx]?.trim() || "";
        const isFocused = focusIndex === idx;
        const filled = char !== "";
        return (
          <div
            key={idx}
            className={cn(
              "relative flex h-14 w-12 items-center justify-center rounded-lg text-2xl font-semibold transition-all",
              hasError
                ? "border-2 border-danger bg-danger-soft text-danger shadow-inner"
                : filled
                ? "border-2 border-outline bg-surface-container-lowest text-on-surface shadow-sm"
                : isFocused
                ? "border-2 border-primary bg-surface-container-lowest text-on-surface shadow-sm ring-4 ring-primary-soft"
                : "border border-outline-variant bg-surface-container/50 text-outline shadow-sm"
            )}
            data-testid={`otp-cell-${idx}`}
            data-filled={filled ? "true" : "false"}
            data-focused={isFocused ? "true" : "false"}
          >
            <input
              ref={setRef(idx)}
              id={`${idPrefix}-${idx}`}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              autoComplete="one-time-code"
              disabled={disabled}
              value={char}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(idx)}
              onBlur={handleBlur}
              aria-label={`OTP digit ${idx + 1}`}
              className="absolute inset-0 h-full w-full cursor-text rounded-lg bg-transparent text-center text-2xl font-semibold text-transparent caret-transparent outline-none"
            />
            {/* Visual content overlay */}
            <span
              className={cn(
                "pointer-events-none select-none",
                hasError ? "text-danger" : "text-on-surface"
              )}
            >
              {char ? (
                char
              ) : isFocused ? (
                <span
                  className="block h-6 w-0.5 animate-pulse bg-primary"
                  aria-hidden
                />
              ) : (
                ""
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
});
