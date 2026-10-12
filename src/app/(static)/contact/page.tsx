"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";

/**
 * Trang stub tĩnh – namespace static.contact.
 *
 * Tại sao là stub:
 *  - Trang này hiện chỉ là placeholder để tránh Next 16 prefetch 404 /
 *    "Invalid URL" khi user click link footer / header.
 *  - Khi có content thật, sẽ thay bằng page render data từ API hoặc
 *    MDX content.
 */
export default function Page() {
  const t = useTranslations("static.contact");

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-center gap-6 px-4 py-12 md:px-8 min-h-[640px]">
      <section className="flex w-full items-center justify-center">
        <div className="flex w-full max-w-[640px] flex-col gap-4 rounded-xl bg-surface-container-lowest p-8 shadow-md sm:p-9 text-center">
          <h1 className="text-2xl font-semibold text-on-surface">
            {t("title")}
          </h1>
          <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
          <p className="text-xs text-outline">{t("comingSoon")}</p>

          <Link
            href={ROUTES.HOME}
            className="mt-2 inline-flex h-[42px] items-center justify-center rounded-lg bg-primary px-4 font-semibold text-on-primary transition-colors hover:bg-primary-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t("backToHome")}
          </Link>
        </div>
      </section>
    </div>
  );
}