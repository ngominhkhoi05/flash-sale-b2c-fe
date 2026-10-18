"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOrderById, useCancelOrder } from "@/features/orders/hooks";
import { useOrderPayment } from "@/features/checkout";
import { PaymentZaloPayPanel } from "@/features/checkout/components/PaymentZaloPayPanel";
import { ReviewProductDialog } from "@/features/orders/components/ReviewProductDialog";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { useAuth } from "@/hooks/useAuth";
import { formatVND, formatDateTime } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";
import { MaterialSymbol, type MaterialSymbolName } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

interface OrderDetailClientProps {
  orderId: number;
}

interface StepItem {
  key: string;
  label: string;
  icon: MaterialSymbolName;
  timestamp?: string | null;
  isPassed: boolean;
  isCurrent: boolean;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showZaloPayModal, setShowZaloPayModal] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: order, isLoading, isError, error } = useOrderById(orderId);
  const { data: payment } = useOrderPayment(orderId, {
    polling: order?.status === ORDER_STATUS.PENDING_PAYMENT,
  });

  const cancelMutation = useCancelOrder({
    onSuccess: () => {
      toast.success("Đã hủy đơn hàng thành công");
    },
    onError: () => {
      toast.error("Không thể hủy đơn hàng vào lúc này");
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 h-72 animate-pulse rounded-2xl bg-surface-container" />
          <div className="lg:col-span-9 flex flex-col gap-6">
            <div className="h-14 animate-pulse rounded-2xl bg-surface-container" />
            <div className="h-32 animate-pulse rounded-2xl bg-surface-container" />
            <div className="h-64 animate-pulse rounded-2xl bg-surface-container" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error-container text-error flex items-center justify-center">
          <MaterialSymbol name="error" size="[32px]" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">Không tìm thấy đơn hàng</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {error instanceof Error ? error.message : "Đơn hàng không tồn tại hoặc bạn không có quyền xem."}
        </p>
        <Link
          href="/orders"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <MaterialSymbol name="arrow_back" size="[18px]" />
          Về danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const isCancelled =
    order.status === ORDER_STATUS.CANCELLED ||
    order.status === "CANCELLED" ||
    order.status.includes("CANCEL");

  const isCompleted = order.status === ORDER_STATUS.COMPLETED || order.status === "COMPLETED";
  const isShipping = order.status === ORDER_STATUS.SHIPPING || order.status === "SHIPPING";
  const isConfirmed = order.status === ORDER_STATUS.CONFIRMED || order.status === "CONFIRMED";
  const isPaid =
    order.paymentStatus === "PAID" ||
    order.status === "PAID" ||
    isConfirmed ||
    isShipping ||
    isCompleted;

  // Xác định các mốc trong tiến trình
  const steps: StepItem[] = [
    {
      key: "created",
      label: "Đã đặt",
      icon: "shopping_cart",
      timestamp: order.createdAt,
      isPassed: true,
      isCurrent: order.status === ORDER_STATUS.PENDING_PAYMENT,
    },
    {
      key: "paid",
      label: "Đã thanh toán",
      icon: "credit_card",
      timestamp: isPaid ? (order.confirmedAt ?? order.createdAt) : null,
      isPassed: isPaid,
      isCurrent: isPaid && !isConfirmed,
    },
    {
      key: "confirmed",
      label: "Shop xác nhận",
      icon: "store",
      timestamp: order.confirmedAt,
      isPassed: isConfirmed || isShipping || isCompleted,
      isCurrent: isConfirmed && !isShipping,
    },
    {
      key: "shipping",
      label: "Đang giao",
      icon: "local_shipping",
      timestamp: order.shippedAt,
      isPassed: isShipping || isCompleted,
      isCurrent: isShipping,
    },
    {
      key: "completed",
      label: "Hoàn thành",
      icon: "check_circle",
      timestamp: order.completedAt,
      isPassed: isCompleted,
      isCurrent: isCompleted,
    },
  ];

  // Trạng thái badge
  const getStatusBadge = () => {
    if (isCancelled) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-200 text-neutral-700">
          Đã hủy
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          Hoàn thành
        </span>
      );
    }
    if (isShipping) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
          Đang giao
        </span>
      );
    }
    if (isConfirmed) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
          Shop đã xác nhận
        </span>
      );
    }
    if (order.status === ORDER_STATUS.PENDING_PAYMENT) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          Chờ thanh toán
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800">
        {order.status}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Menu trái 240px theo Stitch spec */}
        <div className="lg:col-span-3">
          <AccountSidebar
            activeItem="orders"
            displayName={user?.fullName}
            email={user?.email}
            avatarUrl={user?.avatarUrl}
          />
        </div>

        {/* Nội dung chi tiết đơn hàng */}
        <main className="lg:col-span-9 flex flex-col gap-5">
          {/* 1. Dòng đầu: "← Trở lại" | "Mã đơn: FS-261001-A7K2Q" | badge "Đang giao" */}
          <header className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/orders"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group"
              >
                <MaterialSymbol
                  name="arrow_back"
                  size="[18px]"
                  className="group-hover:-translate-x-0.5 transition-transform"
                />
                Trở lại
              </Link>
              <span className="text-outline-variant/60">|</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-on-surface-variant font-medium">Mã đơn:</span>
                <span className="font-mono font-bold text-base text-on-surface">
                  {order.orderCode}
                </span>
              </div>
            </div>
            <div>{getStatusBadge()}</div>
          </header>

          {/* Biến thể đơn bị shop hủy có hoàn tiền: banner nền #FEF3C7 */}
          {isCancelled && (
            <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] p-4 rounded-2xl flex items-start gap-3 shadow-xs">
              <MaterialSymbol name="warning" size="[24px]" className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">
                  Shop đã hủy đơn – Lý do: {order.cancelReason || "Hết hàng / Quá hạn xử lý"}
                </p>
                <p className="text-xs mt-1 text-[#B45309]">
                  Đã hoàn {formatVND(order.totalAmount)} về ví / phương thức{" "}
                  {order.paymentMethod === "ZALOPAY" ? "ZaloPay" : "thanh toán"} lúc{" "}
                  {order.cancelledAt ? formatDateTime(order.cancelledAt) : "ngay sau khi hủy"}.
                </p>
              </div>
            </div>
          )}

          {/* 2. Thanh tiến trình ngang 5 mốc có icon tròn và thời gian (#0284C7 khi đã qua) */}
          <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-outline-variant/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-6">
              Tiến trình đơn hàng
            </h2>
            <div className="relative">
              <div className="grid grid-cols-5 relative z-10">
                {steps.map((step) => {
                  const isPassed = step.isPassed && !isCancelled;
                  const isCurrent = step.isCurrent && !isCancelled;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center px-1">
                      {/* Vòng tròn icon */}
                      <div
                        className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center transition-all",
                          isPassed || isCurrent
                            ? "bg-[#0284C7] text-white shadow-md shadow-sky-500/20"
                            : isCancelled && step.key === "created"
                            ? "bg-neutral-400 text-white"
                            : "bg-surface-container-high text-on-surface-variant/60"
                        )}
                      >
                        <MaterialSymbol name={step.icon} size="[22px]" />
                      </div>

                      {/* Tên bước */}
                      <span
                        className={cn(
                          "mt-3 text-xs font-bold leading-tight",
                          isPassed || isCurrent ? "text-[#0284C7]" : "text-on-surface-variant/70"
                        )}
                      >
                        {step.label}
                      </span>

                      {/* Thời gian */}
                      {step.timestamp && (
                        <span className="mt-1 text-[11px] text-on-surface-variant/80 font-medium">
                          {formatDateTime(step.timestamp)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Đường nối giữa các bước */}
              <div
                className="absolute top-5 left-[10%] right-[10%] h-1 bg-surface-container-high -z-0"
                aria-hidden="true"
              >
                <div
                  className="h-full bg-[#0284C7] transition-all"
                  style={{
                    width: isCancelled
                      ? "0%"
                      : isCompleted
                      ? "100%"
                      : isShipping
                      ? "75%"
                      : isConfirmed
                      ? "50%"
                      : isPaid
                      ? "25%"
                      : "0%",
                  }}
                />
              </div>
            </div>
          </section>

          {/* 3. Hai card cạnh nhau: "Địa chỉ nhận hàng" và "Thanh toán" */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card Địa chỉ nhận hàng */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col">
              <div className="flex items-center gap-2 mb-3 text-on-surface font-bold text-sm">
                <MaterialSymbol name="location_on" size="[20px]" className="text-[#0284C7]" />
                <h3>Địa chỉ nhận hàng</h3>
              </div>
              <div className="space-y-1.5 text-sm flex-1">
                <p className="font-bold text-on-surface">
                  {order.shippingAddress?.recipientName || "Người nhận"}
                </p>
                <p className="text-on-surface-variant font-mono">
                  {order.shippingAddress?.phone || "—"}
                </p>
                <p className="text-on-surface-variant text-xs leading-relaxed mt-1">
                  {order.shippingAddress?.fullAddress ||
                    `${order.shippingAddress?.detailAddress || ""}, ${order.shippingAddress?.ward || ""}, ${order.shippingAddress?.district || ""}, ${order.shippingAddress?.province || ""}`}
                </p>
              </div>
            </div>

            {/* Card Thanh toán */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col">
              <div className="flex items-center gap-2 mb-3 text-on-surface font-bold text-sm">
                <MaterialSymbol name="payments" size="[20px]" className="text-[#0284C7]" />
                <h3>Thông tin thanh toán</h3>
              </div>
              <div className="space-y-2 text-sm flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant text-xs">Phương thức:</span>
                  <span className="font-bold text-on-surface flex items-center gap-1.5">
                    {order.paymentMethod === "ZALOPAY" ? (
                      <>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                        Ví ZaloPay
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Thanh toán khi nhận hàng (COD)
                      </>
                    )}
                  </span>
                </div>
                {order.paymentMethod === "ZALOPAY" && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-xs">Mã giao dịch:</span>
                    <span className="font-mono text-xs text-on-surface">
                      {(() => {
                        const p = payment as Record<string, unknown> | null | undefined;
                        const zp = typeof p?.zpTransToken === "string" ? p.zpTransToken : "";
                        const app = typeof p?.appTransId === "string" ? p.appTransId : "";
                        return zp || app || `ZP-${order.id}-TX`;
                      })()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant text-xs">Thời điểm:</span>
                  <span className="text-xs text-on-surface">
                    {order.confirmedAt ? formatDateTime(order.confirmedAt) : formatDateTime(order.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-on-surface-variant text-xs">Trạng thái:</span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold",
                      isPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {isPaid ? "Thành công" : "Chờ thanh toán"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Card sản phẩm: tên shop + nút "Xem shop"; danh sách sản phẩm */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30">
            {/* Header shop */}
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <MaterialSymbol name="storefront" size="[18px]" />
                </div>
                <span className="font-bold text-sm text-on-surface">{order.storeName || "Vibe Store"}</span>
              </div>
              <Link
                href={`/products?storeId=${order.storeId}`}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/60 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Xem shop
              </Link>
            </div>

            {/* Danh sách items */}
            <div className="divide-y divide-outline-variant/20">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-18 h-18 rounded-xl bg-surface-container overflow-hidden shrink-0 border border-outline-variant/30 flex items-center justify-center">
                      <MaterialSymbol name="inventory_2" size="[28px]" className="text-outline" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {item.flashSaleItemId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error text-white uppercase tracking-wider">
                            Flash Sale
                          </span>
                        )}
                        <h4 className="font-semibold text-sm text-on-surface truncate">
                          {item.productName}
                        </h4>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Phân loại: {item.variantName || "Mặc định"}
                      </p>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                        x{item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs text-on-surface-variant line-through">
                      {formatVND(item.priceAtPurchase * 1.2)}
                    </p>
                    <p className="font-mono font-bold text-sm text-on-surface text-primary">
                      {formatVND(item.priceAtPurchase)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Card tổng tiền canh phải: Tổng tiền hàng, Voucher (−), Phí vận chuyển, Thành tiền */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex justify-end">
            <div className="w-full sm:w-80 space-y-2 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Tổng tiền hàng:</span>
                <span className="font-mono font-medium text-on-surface">
                  {formatVND(order.subtotal || order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Voucher giảm giá:</span>
                <span className="font-mono font-medium text-emerald-600">
                  −{formatVND(order.discountAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Phí vận chuyển:</span>
                <span className="font-mono font-medium text-on-surface">
                  {formatVND(order.shippingFee || 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-outline-variant/40 flex justify-between items-baseline">
                <span className="font-bold text-base text-on-surface">Thành tiền:</span>
                <span className="font-mono font-extrabold text-xl text-[#0284C7]">
                  {formatVND(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Card "Lịch sử thanh toán" dạng bảng nhỏ */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Lịch sử thanh toán
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-on-surface-variant font-semibold">
                    <th className="py-2.5 px-3">Lần</th>
                    <th className="py-2.5 px-3">Cổng thanh toán</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="py-2.5 px-3 font-medium">Lần 1</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {order.paymentMethod === "ZALOPAY" ? "ZaloPay QR" : "COD"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full font-bold text-[11px]",
                          isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {isPaid ? "Thành công" : "Đang chờ thanh toán"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-on-surface-variant">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Nút cuối trang: Secondary "Liên hệ shop", Ghost "Yêu cầu hủy" / Hủy đơn */}
          <footer className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toast.info(`Liên hệ shop ${order.storeName || "Vibe Store"}: 1900-1234`)}
                className="px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors inline-flex items-center gap-2"
              >
                <MaterialSymbol name="chat" size="[18px]" />
                Liên hệ shop
              </button>

              {!isCancelled && !isShipping && !isCompleted && (
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
                      cancelMutation.mutate({ orderId, reason: "Người mua đổi ý" });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-error hover:bg-error-container/20 transition-colors inline-flex items-center gap-1.5"
                >
                  <MaterialSymbol name="cancel" size="[18px]" />
                  {cancelMutation.isPending ? "Đang hủy..." : "Yêu cầu hủy"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {order.status === ORDER_STATUS.PENDING_PAYMENT && order.paymentMethod === "ZALOPAY" && (
                <button
                  type="button"
                  onClick={() => setShowZaloPayModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#0284C7] text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-colors inline-flex items-center gap-2"
                >
                  <MaterialSymbol name="qr_code" size="[18px]" />
                  Thanh toán ngay
                </button>
              )}

              {isCompleted && (
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#0284C7] text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-colors inline-flex items-center gap-2"
                >
                  <MaterialSymbol name="star" size="[18px]" />
                  Đánh giá
                </button>
              )}

              {(isCompleted || isCancelled) && (
                <button
                  type="button"
                  onClick={() => router.push(`/products`)}
                  className="px-5 py-2.5 rounded-xl border border-[#0284C7] text-[#0284C7] font-semibold text-sm hover:bg-sky-50 transition-colors inline-flex items-center gap-2"
                >
                  <MaterialSymbol name="replay" size="[18px]" />
                  Mua lại
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>

      {/* Popup ZaloPay nếu user bấm Thanh toán ngay */}
      {showZaloPayModal && payment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowZaloPayModal(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-container-high transition-colors"
            >
              <MaterialSymbol name="close" size="[20px]" />
            </button>
            <PaymentZaloPayPanel
              orderId={payment.orderId}
              orderCode={payment.orderCode}
              onViewOrder={() => {
                setShowZaloPayModal(false);
                window.location.reload();
              }}
              onRetry={() => {
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

      {/* Popup Đánh giá nếu đơn đã hoàn thành */}
      {isReviewOpen && order.items?.[0] && (
        <ReviewProductDialog
          orderId={order.id}
          orderCode={order.orderCode}
          productName={order.items[0].productName}
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
        />
      )}
    </div>
  );
}
