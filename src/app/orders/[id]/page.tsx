/**
 * Trang chi tiết đơn hàng + thanh toán ZaloPay — `/orders/[id]`.
 *
 * Theo `docs/handoffs/fe-zalopay-integration-guide.md`:
 *  - Server Component: parse `params.id` (Next 16 — params là Promise).
 *  - Validate auth (cookie `access_token`) → redirect về /login nếu chưa.
 *  - Render `<OrderDetailClient />` với `orderId` (number) + `orderCode` (optional).
 *
 * Page này KHÔNG fetch trực tiếp — để Client Component + TanStack Query lo
 * (vì cần WS + polling realtime cho payment status).
 */
import { redirect } from "next/navigation";
import { OrderDetailClient } from "./OrderDetailClient";
import { maybeSession } from "@/lib/auth-guard";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Đơn hàng – Vibe Mart",
  description:
    "Xem chi tiết đơn hàng và hoàn tất thanh toán ZaloPay cho đơn hàng Vibe Mart của bạn.",
};

export default async function OrderDetailPage({ params }: { params: Params }) {
  // Auth guard — Server side (dùng maybeSession để có thể render "Vui lòng đăng nhập" UI)
  const session = await maybeSession();
  if (!session) {
    redirect("/login?redirect=/orders");
  }

  // Parse orderId từ URL
  const { id } = await params;
  const orderId = Number.parseInt(id, 10);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-xl font-semibold text-on-surface">
          Mã đơn hàng không hợp lệ
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Vui lòng kiểm tra lại đường dẫn.
        </p>
      </div>
    );
  }

  return <OrderDetailClient orderId={orderId} />;
}
