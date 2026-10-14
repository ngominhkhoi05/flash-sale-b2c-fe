/**
 * CheckoutStepper – thanh 3 bước ngay dưới CheckoutHeader.
 * Bước 1 (Giỏ hàng ✓) → Bước 2 (Thanh toán, active) → Bước 3 (Hoàn tất).
 * Stitch reference: ui-code-dump.md L39–80.
 */
"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type CheckoutStep = {
  id: 1 | 2 | 3;
  label: string;
  state: "done" | "active" | "upcoming";
};

const STEPS: CheckoutStep[] = [
  { id: 1, label: "Giỏ hàng", state: "done" },
  { id: 2, label: "Thanh toán", state: "active" },
  { id: 3, label: "Hoàn tất", state: "upcoming" },
];

export function CheckoutStepper() {
  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Track line */}
        <span
          aria-hidden
          className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-1 bg-surface-container-high z-0 rounded-full"
        >
          <span
            aria-hidden
            className="block h-full bg-secondary rounded-full"
            style={{ width: "50%" }}
          />
        </span>

        {STEPS.map((step) => {
          const isDone = step.state === "done";
          const isActive = step.state === "active";
          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center gap-1"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center font-semibold text-base shadow-sm",
                  isDone && "bg-secondary text-on-secondary",
                  isActive && "bg-primary text-on-primary ring-4 ring-primary-fixed",
                  !isDone && !isActive && "bg-surface-container-high text-on-surface-variant",
                )}
                data-testid={`checkout-step-${step.id}`}
                data-state={step.state}
              >
                {isDone ? <MaterialSymbol name="check" size="lg" /> : step.id}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isDone && "text-secondary",
                  isActive && "text-primary font-bold",
                  !isDone && !isActive && "text-on-surface-variant",
                )}
              >
                {step.label}
                {isDone && (
                  <span aria-hidden className="ml-1">
                    ✓
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
