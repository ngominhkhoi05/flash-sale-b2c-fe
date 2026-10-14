/**
 * SuccessPageContent – Client Component bridging data layer + UI.
 *
 * Sits between the Server Component page and the visual SuccessModule.
 *  - Fetch OrderSuccessView via useOrderSuccessByCode hook
 *  - Fall back to mock when `orderCode` is missing (dev UI)
 *  - Handle loading + error states
 */
"use client";

import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useOrderSuccessByCode, mockOrderSuccessView } from "@/features/orders";

import { SuccessModule } from "./SuccessModule";

interface SuccessPageContentProps {
  orderCode?: string;
}

export function SuccessPageContent({ orderCode }: SuccessPageContentProps) {
  const t = useTranslations("storefront.checkout.success");

  const query = useOrderSuccessByCode(orderCode ?? "");
  // Fallback về mock khi thiếu orderCode (rule §7: "không bịa API").
  const data = query.data ?? mockOrderSuccessView;

  // ── Loading state ────────────────────────────────────
  if (query.isLoading) {
    return (
      <div
        className="flex flex-col w-full items-center py-space-xl px-margin"
        data-testid="success-loading"
      >
        <div className="w-full max-w-[560px] bg-surface-container-lowest rounded-2xl shadow-sm p-8 flex flex-col items-center gap-4">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-[10px]" />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────
  if (query.isError) {
    return (
      <div className="flex flex-col w-full items-center py-space-xl px-margin">
        <ErrorState
          title={t("errorTitle")}
          message={t("errorDescription")}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  // ── Empty state (khi API trả về data rỗng) ──────────
  if (data.orderCodes.length === 0) {
    return (
      <div className="flex flex-col w-full items-center py-space-xl px-margin">
        <EmptyState
          icon={
            <MaterialSymbol
              name="receipt_long"
              size="3xl"
              className="text-on-surface-variant"
            />
          }
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      </div>
    );
  }

  return <SuccessModule order={data} />;
}
