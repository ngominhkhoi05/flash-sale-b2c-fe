"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Trang xác thực email (OTP).
 *
 * TODO (task riêng):
 *  - Stitch screen: "Kiểm tra email" (26dbd4cd7e7f47c68d509c58a44cb083)
 *  - Gửi OTP code 6 chữ số
 *  - Countdown timer gửi lại (55s)
 *  - Nút "Mở ứng dụng email" → deep link
 *  - Backend: POST /api/v1/auth/verify-email + POST /api/v1/auth/resend-otp
 *
 * Stub hiện tại: hiện email từ query param, message.
 * Backend register phải gửi email verification trước.
 */
export default function XacThucEmailPage() {
  const searchParams = useSearchParams();
  const rawEmail = searchParams.get("email") ?? "";

  const maskedEmail = rawEmail
    ? (() => {
        const atIdx = rawEmail.indexOf("@");
        const local = rawEmail.slice(0, Math.min(2, atIdx));
        const domain = rawEmail.slice(atIdx);
        return `${local}***${domain}`;
      })()
    : "email của bạn";

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-center gap-6 px-4 py-4 md:flex-row md:gap-8 md:px-8 md:py-8 lg:gap-10 min-h-[640px]">
      <div className="hidden w-full md:flex md:w-[54%] lg:w-[55%]">
        {/* Brand panel reuse — same as login/register */}
      </div>
      <section className="flex w-full items-center justify-center md:w-[46%] lg:w-[45%]">
        <div className="flex w-full max-w-[420px] flex-col gap-0 rounded-2xl bg-surface-container-lowest p-8 shadow-sm sm:p-9">
          <div className="mb-5 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold text-on-surface">
              Kiểm tra hộp thư của bạn
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Chúng tôi đã gửi liên kết xác thực tài khoản đến{" "}
              <span className="font-semibold text-on-surface">
                {maskedEmail}
              </span>
            </p>
          </div>

          {/* Open email button (stub) */}
          <a
            href={`https://mail.google.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-on-primary font-semibold shadow-sm transition-colors hover:bg-primary-container active:scale-[0.99]"
          >
            Mở ứng dụng email
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v-2h4v2h4v2h-2v2h2v2h-2v2h-4v-2h-4v-2h4v-2h-4V3z" />
            </svg>
          </a>

          {/* Resend hint */}
          <p className="mt-4 text-center text-xs text-on-surface-variant">
            Chưa nhận được email? Kiểm tra thư mục Spam.
          </p>

          {/* Back to login */}
          <div className="mt-5 flex items-center justify-center gap-1 text-sm text-on-surface-variant">
            <Link
              href="/dang-nhap"
              className="inline-flex items-center gap-1 text-on-surface hover:text-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
