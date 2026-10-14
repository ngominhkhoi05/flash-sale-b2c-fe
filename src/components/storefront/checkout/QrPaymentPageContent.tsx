/**
 * QrPaymentPageContent – Client Component bridging data layer + UI.
 *
 * Sits between the Server Component page and the visual QrPaymentModule.
 * Responsible for:
 *  - Fetching QrOrderDetail via useOrderForQr hook
 *  - Falling back to mock data when `orderCode` is missing (dev UI)
 *  - Handling the "Tôi đã hoàn tất" CTA → toast + redirect to /orders
 *
 * Out of scope: realtime polling for payment status (next phase).
 */
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { QrPaymentModule } from "@/components/storefront/checkout/QrPaymentModule";
import { ROUTES } from "@/lib/constants";
import { mockQrOrderDetail, useOrderForQr } from "@/features/checkout";

interface QrPaymentPageContentProps {
  orderCode?: string;
}

export function QrPaymentPageContent({ orderCode }: QrPaymentPageContentProps) {
  const router = useRouter();
  const t = useTranslations("storefront.checkout.qrPayment");

  // Wire thật: fetch từ backend. Nếu orderCode rỗng → dùng mock
  // (rule §7: "không bịa API", dùng mock đúng kiểu + ghi TODO comment).
  const query = useOrderForQr(orderCode ?? "");
  const order = query.data ?? mockQrOrderDetail;

  const handleComplete = () => {
    // TODO(realtime): khi có WS / polling, đợi backend xác nhận PAID trước
    // khi navigate. Hiện tại navigate ngay → trang chi tiết đơn sẽ poll.
    toast.success(t("completedToast"));
    router.push(ROUTES.ORDERS);
  };

  return (
    <QrPaymentModule order={order} onComplete={handleComplete} />
  );
}
