/**
 * QrPaymentPageContent – Client Component bridging data layer + UI.
 *
 * Sits between the Server Component page and the visual QrPaymentModule.
 * Responsible for:
 *  - Fetching real QrOrderDetail via useOrderForQr hook (with 3s polling)
 *  - Subscribing to real-time WebSocket PAYMENT_STATUS_CHANGED event
 *  - Handling the "Tôi đã hoàn tất thanh toán" CTA: queries ZaloPay gateway via BE
 *  - Auto-redirecting to /checkout/success when payment SUCCESS
 *  - Auto-redirecting to /checkout/expired when order expires
 */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { QrPaymentModule } from "@/components/storefront/checkout/QrPaymentModule";
import {
  mockQrOrderDetail,
  useOrderForQr,
  useQueryZaloPayPaymentByCode,
} from "@/features/checkout";
import { useFlashSaleWs } from "@/hooks/useFlashSaleWs";

interface QrPaymentPageContentProps {
  orderCode?: string;
}

export function QrPaymentPageContent({ orderCode }: QrPaymentPageContentProps) {
  const router = useRouter();
  const t = useTranslations("storefront.checkout.qrPayment");
  const redirectedRef = useRef(false);

  // Polling fallback 3s/lần khi chưa thanh toán xong
  const query = useOrderForQr(orderCode ?? "", {
    refetchInterval: 3000,
  });
  const order = query.data ?? mockQrOrderDetail;

  const { mutateAsync: querySync } = useQueryZaloPayPaymentByCode();

  const handleSuccessRedirect = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    toast.success(t("completedToast"));
    const safeCode = orderCode ? encodeURIComponent(orderCode) : "";
    router.push(`/checkout/success?orderCode=${safeCode}`);
  };

  // 1. Subscribe WebSocket realtime event
  useFlashSaleWs(
    useMemo(
      () => ({
        enabled: Boolean(orderCode),
        subscribeOrderCodes: orderCode ? [orderCode] : [],
        onMessage: (event) => {
          if (event?.eventType !== "PAYMENT_STATUS_CHANGED") return;
          const status = (event as { paymentStatus?: string }).paymentStatus;
          if (status === "SUCCESS") {
            handleSuccessRedirect();
          }
        },
      }),
      [orderCode],
    ),
  );

  // 2. Tự động kiểm tra trạng thái từ REST polling
  useEffect(() => {
    if (order?.paymentStatus === "SUCCESS") {
      handleSuccessRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.paymentStatus]);

  // 3. User click nút "Tôi đã hoàn tất thanh toán"
  const handleComplete = async () => {
    if (!orderCode) {
      router.push("/orders");
      return;
    }
    try {
      const res = await querySync(orderCode);
      if (res.status === "SUCCESS") {
        handleSuccessRedirect();
      } else {
        toast.info("Đang chờ ZaloPay xác nhận giao dịch. Vui lòng hoàn tất thanh toán trên app.");
      }
    } catch {
      toast.info("Đang kiểm tra kết quả giao dịch...");
    }
  };

  return (
    <QrPaymentModule order={order} onComplete={handleComplete} />
  );
}
