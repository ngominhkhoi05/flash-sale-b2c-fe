/**
 * Trang Tài khoản (Storefront) — `/tai-khoan`.
 * Stub page: render AuthGuard + EmptyState + skeleton.
 * UI đầy đủ (profile, đơn hàng, đăng xuất) sẽ làm sau.
 */
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EmptyState } from "@/components/common/EmptyState";

function AccountContent() {
  const t = useTranslations("storefront.account");

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="mb-6 text-2xl font-semibold text-on-surface">{t("title")}</h1>
      <EmptyState
        icon={<User className="h-6 w-6" aria-hidden />}
        title={t("empty")}
        description={t("emptyDescription")}
      />
    </div>
  );
}

export default function TaiKhoanPage() {
  return (
    <AuthGuard
      fallback={
        <div className="mx-auto max-w-3xl py-8">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-surface-container" />
          <div className="h-64 animate-pulse rounded-xl bg-surface-container" />
        </div>
      }
    >
      <AccountContent />
    </AuthGuard>
  );
}
