"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { VerifyEmailSuccessCard } from "@/components/auth/VerifyEmailSuccessCard";

/**
 * Trang xác thực email thành công – Stitch state (d) Thành công.
 *
 * Flow:
 *  - User vừa submit OTP thành công → redirect từ `/verify-email`
 *  - Hiển thị card thành công + auto-redirect 5s về `/login`
 *
 * Layout:
 *  - 2 cột desktop (md:flex-row):
 *    + Trái: AuthBrandPanel
 *    + Phải: VerifyEmailSuccessCard (max-w-[460px])
 *  - Mobile: stack dọc, brand ẩn
 *
 * @see docs/superpowers/handoffs/xac-thu-email-thanh-cong.md
 * @see docs/superpowers/plans/2026-10-13-verify-email-success-state.md
 */
export default function VerifyEmailSuccessPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailSuccessContent />
    </Suspense>
  );
}

function VerifyEmailSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <div
      className="mx-auto flex w-full max-w-[1240px] flex-col items-stretch justify-center gap-6 px-4 py-4 md:flex-row md:gap-8 md:px-8 md:py-8 lg:gap-10 min-h-[640px]"
      data-testid="verify-email-success-page"
    >
      <div className="hidden w-full md:flex md:w-[54%] md:items-stretch lg:w-[55%]">
        <AuthBrandPanel />
      </div>
      <section className="flex w-full items-center justify-center md:w-[46%] lg:w-[45%]">
        <div className="flex w-full max-w-[460px] flex-col gap-0 rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <VerifyEmailSuccessCard email={email} />
        </div>
      </section>
    </div>
  );
}
