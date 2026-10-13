"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES, ROLES } from "@/lib/constants";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

/**
 * Trang xác thực email (OTP 6 số) – Stitch screen 26dbd4cd7e7f47c68d509c58a44cb083.
 *
 * Flow:
 *  - User vừa đăng ký xong → redirect tới đây với ?email=<...>
 *  - Nhập OTP 6 số → thành công → redirect về /login
 *  - Nếu chưa có email param → render form với placeholder
 *
 * Layout:
 *  - 2 cột desktop (md:flex-row):
 *    + Trái: AuthBrandPanel
 *    + Phải: VerifyEmailForm (max-w-[460px])
 *  - Mobile: stack dọc, brand ẩn
 *
 * Redirect rule (rule auth-jwt):
 *  - Đã login → về HOME (BUYER) hoặc SELLER_HOME/ADMIN_HOME
 *
 * @see docs/superpowers/plans/2026-10-13-verify-email-otp-form.md
 */
export default function XacThucEmailPage() {
  return (
    <Suspense fallback={null}>
      <XacThucEmailContent />
    </Suspense>
  );
}

function XacThucEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const email = searchParams.get("email") ?? "";

  useEffect(() => {
    if (!user) return;
    if (user.role === ROLES.SELLER) {
      router.replace(ROUTES.SELLER_HOME);
    } else if (user.role === ROLES.ADMIN) {
      router.replace(ROUTES.ADMIN_HOME);
    } else {
      router.replace(ROUTES.HOME);
    }
  }, [user, router]);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col items-stretch justify-center gap-6 px-4 py-4 md:flex-row md:gap-8 md:px-8 md:py-8 lg:gap-10 min-h-[640px]">
      <div className="hidden w-full md:flex md:w-[54%] md:items-stretch lg:w-[55%]">
        <AuthBrandPanel />
      </div>
      <section className="flex w-full items-center justify-center md:w-[46%] lg:w-[45%]">
        <div className="flex w-full max-w-[460px] flex-col gap-0 rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <VerifyEmailForm email={email} />
        </div>
      </section>
    </div>
  );
}
