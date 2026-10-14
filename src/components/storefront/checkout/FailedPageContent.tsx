/**
 * FailedPageContent – Client Component bridging data layer + UI.
 *
 * Sits between the Server Component page and the visual FailedModule.
 *  - Fetch OrderFailedView via useOrderFailedByCode hook
 *  - Fall back to mock when `orderCode` is missing (dev UI)
 *  - Handle loading + error states
 *  - Wire onSelectCod callback (currently toast — TODO: call real API)
 */
"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { mockOrderFailedView } from "@/features/orders";

import { FailedModule } from "./FailedModule";

interface FailedPageContentProps {
  orderCode?: string;
}

export function FailedPageContent({ orderCode: _orderCode }: FailedPageContentProps) {
  // TODO(api): dùng `orderCode` để fetch useOrderFailedByCode khi BE wire xong.
  // Hiện tại hook throw (chưa wire BE) → dùng mock trực tiếp.
  void _orderCode; // suppress unused-var (sẽ dùng khi BE wire)
  const t = useTranslations("storefront.checkout.failed");

  // Wire thật: khi useOrderFailedByCode wire xong sẽ dùng `query.data`.
  // Hiện tại hook throw (TODO(api)) → dùng mock trực tiếp.
  const data = mockOrderFailedView;

  // ── Loading state ────────────────────────────────────
  // Hiện tại không có async load (mock sync) — nhưng giữ skeleton
  // để consistent với SuccessPageContent khi BE wire xong.
  const isLoading = false;
  if (isLoading) {
    return (
      <div
        className="flex flex-col w-full items-center py-space-xl px-margin"
        data-testid="failed-loading"
      >
        <div className="w-full max-w-[560px] bg-surface-container-lowest rounded-2xl shadow-sm p-8 flex flex-col items-center gap-4">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Error state (placeholder — wire khi BE ready) ──
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

  const handleSelectCod = () => {
    // TODO(api): khi BE có endpoint PATCH /api/v1/orders/{id}/payment-method
    // thì gọi mutation thật ở đây. Hiện tại chỉ toast thông báo.
    toast.info("Tính năng đang phát triển — chọn COD sẽ được kích hoạt khi BE sẵn sàng.");
  };

  return <FailedModule order={data} onSelectCod={handleSelectCod} />;
}
