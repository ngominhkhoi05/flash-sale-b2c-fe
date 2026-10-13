"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * OtpStepper – 3 bước stepper cân đối.
 *
 * Pattern:
 *  - Step 1 (done) → checkmark xanh
 *  - Step 2 (active) → số 2 trong vòng tròn primary + ring primary-soft
 *  - Step 3 (pending) → số 3 trong vòng trám xám
 *  - Line nối giữa các step: xanh nếu step trước done, xám nếu chưa
 *
 * Stitch spec:
 *  - Mỗi step: w-24 column, số ở w-8 h-8, label dưới text-[12px]
 *  - Line: h-[2px] flex-1, position relative, -mt-5 (chồng lên số)
 *
 * @see docs/superpowers/handoffs/xac-thuc-email.md
 */
export type OtpStepState = "done" | "active" | "pending";

export interface OtpStepperProps {
  /** Trạng thái từng step (mảng length = 3). */
  steps?: [OtpStepState, OtpStepState, OtpStepState];
  className?: string;
}

const DEFAULT_STEPS: [OtpStepState, OtpStepState, OtpStepState] = [
  "done",
  "active",
  "pending",
];

const CHECK_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export function OtpStepper({
  steps = DEFAULT_STEPS,
  className,
}: OtpStepperProps) {
  const t = useTranslations("auth.verifyEmail");
  const labels = [t("step1Label"), t("step2Label"), t("step3Label")];

  return (
    <div
      className={cn("w-full", className)}
      data-testid="otp-stepper"
      role="list"
    >
      <div className="flex items-center justify-between">
        {steps.map((state, idx) => {
          const isLast = idx === steps.length - 1;
          const isFirst = idx === 0;
          const nextState = !isLast ? steps[idx + 1] : null;

          return (
            <div
              key={idx}
              className="flex flex-1 items-center justify-center"
              role="listitem"
            >
              {/* Step circle + label */}
              <div
                className="flex w-24 flex-col items-center"
                data-testid={`otp-step-${idx}`}
                data-state={state}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full font-semibold shadow-sm transition-colors",
                    state === "done" &&
                      "bg-success text-on-primary",
                    state === "active" &&
                      "bg-primary text-on-primary ring-4 ring-primary-soft",
                    state === "pending" &&
                      "bg-surface-container text-on-surface-variant"
                  )}
                  data-testid={`otp-step-circle-${idx}`}
                >
                  {state === "done" ? (
                    CHECK_ICON
                  ) : (
                    <span className="text-[13px]">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-center text-[12px] font-medium whitespace-nowrap",
                    state === "done" && "text-success",
                    state === "active" && "font-semibold text-primary",
                    state === "pending" && "text-outline"
                  )}
                >
                  {labels[idx]}
                </span>
              </div>

              {/* Line nối (chỉ hiện giữa các step) */}
              {!isLast && (
                <div
                  className={cn(
                    "h-[2px] flex-1",
                    // Line xanh nếu step hiện tại done
                    state === "done" ? "bg-success" : "bg-surface-container-high",
                    // Margin để line nằm ngang hàng với tâm số
                    "-mt-5"
                  )}
                  aria-hidden
                  data-testid={`otp-step-line-${idx}`}
                />
              )}

              {/* Suppress unused warning */}
              {isFirst && nextState === null && null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
