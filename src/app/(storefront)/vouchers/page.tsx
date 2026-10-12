/**
 * Trang Kho voucher cá nhân (Storefront) — `/kho-voucher`.
 * Stub page: render AuthGuard + EmptyState + skeleton.
 * UI đầy đủ sẽ làm sau khi backend cung cấp GET /api/v1/vouchers/mine.
 */
import Link from "next/link";
import { Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EmptyState } from "@/components/common/EmptyState";
import { ROUTES } from "@/lib/constants";

function VoucherContent() {
  const t = useTranslations("storefront.voucher");

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="mb-6 text-2xl font-semibold text-on-surface">{t("title")}</h1>
      <EmptyState
        icon={<Ticket className="h-6 w-6" aria-hidden />}
        title={t("empty")}
        description={t("emptyDescription")}
      />
      <div className="mt-6 text-center">
        <Link
          href={ROUTES.HOME}
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← {t("browseVouchers")}
        </Link>
      </div>
    </div>
  );
}

export default function KhoVoucherPage() {
  return (
    <AuthGuard
      fallback={
        <div className="mx-auto max-w-3xl py-8">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-surface-container" />
          <div className="h-64 animate-pulse rounded-xl bg-surface-container" />
        </div>
      }
    >
      <VoucherContent />
    </AuthGuard>
  );
}
