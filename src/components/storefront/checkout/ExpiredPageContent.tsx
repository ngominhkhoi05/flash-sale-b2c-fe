/**
 * ExpiredPageContent – Client Component bridging data layer + UI.
 *
 * Sits between the Server Component page and the visual ExpiredModule.
 *  - Fetch OrderExpiredView via useOrderExpiredByCode hook (TODO khi BE wire)
 *  - Fall back to mock when `orderCode` is missing (dev UI)
 *  - Handle loading + error states
 */
"use client";

import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { mockOrderExpiredView } from "@/features/orders";

import { ExpiredModule } from "./ExpiredModule";

interface ExpiredPageContentProps {
  orderCode?: string;
}

export function ExpiredPageContent({ orderCode: _orderCode }: ExpiredPageContentProps) {
  // TODO(api): dùng `orderCode` để fetch useOrderExpiredByCode khi BE wire xong.
  // Hiện tại hook throw (chưa wire BE) → dùng mock trực tiếp.
  void _orderCode; // suppress unused-var (sẽ dùng khi BE wire)
  const t = useTranslations("storefront.checkout.expired");

  // ── Loading state (placeholder) ──
  const isLoading = false;
  if (isLoading) {
    return (
      <div
        className="flex flex-col w-full items-center py-space-xl px-margin"
        data-testid="expired-loading"
      >
        <div className="w-full max-w-[560px] bg-surface-container-lowest rounded-2xl shadow-sm p-8 flex flex-col items-center gap-4">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-[10px]" />
        </div>
      </div>
    );
  }

  // ── Error state (placeholder) ──
  const isError = false;
  if (isError) {
    return (
      <div className="flex flex-col w-full items-center py-space-xl px-margin">
        <ErrorState
          title={t("errorTitle")}
          message={t("errorDescription")}
          onRetry={() => {
            // refetch when BE wired
          }}
        />
      </div>
    );
  }

  return <ExpiredModule order={mockOrderExpiredView} />;
}
