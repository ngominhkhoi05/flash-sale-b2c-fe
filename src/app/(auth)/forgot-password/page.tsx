"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";

/**
 * Trang quên mật khẩu – stub tạm thời.
 *
 * Tại sao là stub:
 *  - Backend chưa có endpoint `POST /api/v1/auth/forgot-password`
 *    (chỉ có login/register/refresh/logout – xem AuthController.java).
 *  - Khi có endpoint, sẽ implement form nhập email + gọi API + toast.
 *  - Hiện tại chỉ hiện thông báo "đang phát triển" + nút quay lại
 *    /dang-nhap để tránh Next 16 prefetch 404 / "Invalid URL" khi
 *    user click "Quên mật khẩu?" ở LoginForm.
 *
 * Lưu ý: dùng `next/link` thay vì `next-intl/navigation` vì
 * next-intl@4.14.9 chưa tương thích Next 16.3.8 (vẫn import
 * "next/navigation" không có extension). Khi upgrade next-intl v5+,
 * chuyển sang dùng `Link` từ `@/i18n/navigation`.
 */
export default function QuenMatKhauPage() {
  const t = useTranslations("auth.forgotPassword");

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-center gap-6 px-4 py-12 md:px-8 min-h-[640px]">
      <section className="flex w-full items-center justify-center">
        <div className="flex w-full max-w-[420px] flex-col gap-4 rounded-xl bg-surface-container-lowest p-8 shadow-md sm:p-9 text-center">
          <h1 className="text-2xl font-semibold text-on-surface">
            {t("title")}
          </h1>
          <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
          <p className="text-xs text-outline">{t("comingSoon")}</p>

          <Link
            href={ROUTES.LOGIN}
            className="mt-2 inline-flex h-[42px] items-center justify-center rounded-lg bg-primary px-4 font-semibold text-on-primary transition-colors hover:bg-primary-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </section>
    </div>
  );
}