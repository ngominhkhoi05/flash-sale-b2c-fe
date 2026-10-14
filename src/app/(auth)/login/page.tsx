"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES, ROLES } from "@/lib/constants";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Trang đăng nhập – Stitch 203897a8.
 * - Container: max-w-[1240px], mx-auto, px-4 md:px-8, py-4 md:py-8
 * - 2-cột desktop (md:flex-row):
 *   + Trái: AuthBrandPanel (md:w-[54%], lg:w-[55%])
 *   + Phải: form card (md:w-[46%], lg:w-[45%]), max-w-[420px]
 * - Mobile: stack dọc, brand ẩn
 *
 * Redirect rule:
 * - Đã login → về redirect param (nếu có) hoặc HOME (BUYER) / SELLER_HOME / ADMIN_HOME
 */

/** Inner component để dùng useSearchParams (cần Suspense) */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (!user) return;
    // Ưu tiên redirect param nếu có (từ proxy redirect)
    if (redirect) {
      router.replace(redirect);
    } else if (user.role === ROLES.SELLER) {
      router.replace(ROUTES.SELLER_HOME);
    } else if (user.role === ROLES.ADMIN) {
      router.replace(ROUTES.ADMIN_HOME);
    } else {
      router.replace(ROUTES.HOME);
    }
  }, [user, router, redirect]);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col items-stretch justify-center gap-6 px-4 py-4 md:flex-row md:gap-8 md:px-8 md:py-8 lg:gap-10 min-h-[640px]">
      <div className="hidden w-full md:flex md:w-[54%] md:items-stretch lg:w-[55%]">
        <AuthBrandPanel />
      </div>
      <section className="flex w-full items-center justify-center md:w-[46%] lg:w-[45%]">
        <div className="flex w-full max-w-[420px] flex-col gap-0 rounded-xl bg-surface-container-lowest p-8 shadow-md sm:p-9">
          <LoginForm />
          <SocialLoginButtons />
        </div>
      </section>
    </div>
  );
}

export default function DangNhapPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col items-stretch justify-center gap-6 px-4 py-4 md:flex-row md:gap-8 md:px-8 md:py-8 lg:gap-10 min-h-[640px]">
      <div className="hidden w-full md:flex md:w-[54%] md:items-stretch lg:w-[55%]">
        <Skeleton className="h-full min-h-[500px] rounded-2xl" />
      </div>
      <section className="flex w-full items-center justify-center md:w-[46%] lg:w-[45%]">
        <div className="flex w-full max-w-[420px] flex-col gap-4 rounded-xl bg-surface-container-lowest p-8 shadow-md sm:p-9">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </section>
    </div>
  );
}
