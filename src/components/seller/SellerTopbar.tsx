"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useMyStore } from "@/hooks/useMyStore";
import { useMeQuery, useLogoutMutation } from "@/features/auth/hooks";
import { getSellerOrders } from "@/lib/api/seller";
import type { SellerOrderResponse } from "@/types/seller";
import { formatVND } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SellerTopbarProps {
  storeName?: string;
  storeRole?: string;
  avatarInitials?: string;
}

/**
 * SellerTopbar – Topbar Kênh Người Bán chuẩn Stitch.
 * Cố định trên cùng (left-60, h-16), backdrop-blur.
 * Tự động lấy tên gian hàng thật của tài khoản đăng nhập qua useMyStore().
 * Logo/Avatar trên topbar khi click hiển thị thông tin cá nhân và nút đăng xuất.
 */
export function SellerTopbar({
  storeName: propStoreName,
  storeRole = "Chủ gian hàng",
  avatarInitials: propInitials,
}: SellerTopbarProps) {
  const router = useRouter();
  const { store, storeName: realStoreName, storeCode, storeStatusText, initials } = useMyStore();
  const { data: userData } = useMeQuery();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

  const [newOrders, setNewOrders] = useState<SellerOrderResponse[]>([]);
  const [hasNewAlert, setHasNewAlert] = useState<boolean>(false);

  // Polling / fetch danh sách đơn hàng để kiểm tra đơn hàng mới
  useEffect(() => {
    let isMounted = true;

    const checkOrders = async () => {
      try {
        const res = await getSellerOrders(0, 15);
        const list = res.items || res.content || [];
        // Lọc các đơn hàng mới cần thông báo: PENDING hoặc PENDING_PAYMENT
        const pending = list.filter(
          (o) => o.status === "PENDING" || o.status === "PENDING_PAYMENT"
        );

        if (!isMounted) return;
        setNewOrders(pending);

        if (pending.length > 0) {
          setHasNewAlert(true);

          // Bật toast một lần duy nhất cho mỗi đơn hàng mới trong session
          const latest = pending[0];
          const notifiedKey = `notified_order_${latest.id}`;
          if (typeof window !== "undefined" && !sessionStorage.getItem(notifiedKey)) {
            sessionStorage.setItem(notifiedKey, "true");
            toast.info(`🔔 Đơn hàng mới #${latest.orderCode}!`, {
              description: `Khách hàng ${latest.recipientName} vừa đặt đơn ${formatVND(
                latest.totalAmount || 0
              )}`,
              action: {
                label: "Xem đơn",
                onClick: () => router.push("/seller/orders"),
              },
            });
          }
        } else {
          setHasNewAlert(false);
        }
      } catch (err) {
        console.warn("Fetch seller orders for notifications warning:", err);
      }
    };

    checkOrders();

    // Định kỳ quét đơn hàng mới mỗi 30 giây
    const interval = setInterval(checkOrders, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router]);

  const finalStoreName = propStoreName || realStoreName || "Gian hàng";
  const finalInitials = propInitials || initials || "VM";
  const finalStoreCode = storeCode || (store?.id ? `#VM-${store.id}` : "");
  const avatarImage = userData?.avatarUrl || store?.logoUrl;

  const isApproved = store?.status === "APPROVED" || store?.status === "ACTIVE";

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/30 z-40 select-none">
      <div className="h-16 w-full px-space-lg flex items-center justify-between">
        {/* Breadcrumb Left */}
        <div className="flex items-center gap-space-xs font-body-md text-body-sm text-secondary">
          <Link href="/seller" className="hover:text-on-surface transition-colors cursor-pointer">
            Kênh Người Bán
          </Link>
          <MaterialSymbol name="chevron_right" size="[16px]" className="text-outline" />
          <span className="font-label-md text-body-sm text-on-surface font-semibold max-w-[240px] truncate">
            {finalStoreName}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-space-md">
          {/* Back to Storefront Link */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg text-secondary hover:bg-surface-container-low hover:text-on-surface font-body-md text-body-sm transition-colors border border-outline-variant/30"
          >
            <MaterialSymbol name="open_in_new" size="[18px]" />
            <span>Về trang mua sắm</span>
          </Link>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  hasNewAlert && newOrders.length > 0
                    ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                    : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
                }`}
                aria-label="Thông báo đơn hàng"
              >
                <MaterialSymbol name="notifications" size="[22px]" />
                {hasNewAlert && newOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-container-lowest animate-pulse">
                    {newOrders.length > 9 ? "9+" : newOrders.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-80 sm:w-96 p-0 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-80 zoom-in-95"
            >
              {/* Header */}
              <div className="p-3.5 bg-surface-container-low/70 border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MaterialSymbol name="notifications_active" size="[20px]" className="text-emerald-600" />
                  <span className="font-headline-md text-body-md font-bold text-on-surface">
                    Thông báo đơn hàng
                  </span>
                </div>
                {newOrders.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                    {newOrders.length} đơn mới
                  </span>
                ) : (
                  <span className="text-xs text-secondary">Cập nhật vừa xong</span>
                )}
              </div>

              {/* Body */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/10">
                {newOrders.length === 0 ? (
                  <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                      <MaterialSymbol name="check_circle" size="[22px]" className="text-emerald-600" />
                    </div>
                    <p className="text-body-sm font-semibold text-on-surface">
                      Không có đơn hàng mới nào
                    </p>
                    <p className="text-label-sm text-secondary max-w-[240px]">
                      Hệ thống sẽ tự động phát tín hiệu và bật thông báo khi có đơn hàng mới phát sinh.
                    </p>
                  </div>
                ) : (
                  newOrders.map((order) => (
                    <DropdownMenuItem
                      key={order.id}
                      asChild
                      className="p-3 hover:bg-surface-container-low/60 transition-colors cursor-pointer focus:bg-surface-container-low"
                    >
                      <Link href="/seller/orders" className="flex items-start gap-3 w-full">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
                          <MaterialSymbol name="shopping_bag" size="[18px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-label-md text-label-md font-bold text-on-surface truncate">
                              #{order.orderCode}
                            </span>
                            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                              {order.status === "PENDING"
                                ? "Chờ xác nhận"
                                : order.status === "PENDING_PAYMENT"
                                ? "Chờ thanh toán"
                                : order.status}
                            </span>
                          </div>
                          <p className="text-body-sm text-secondary truncate">
                            Khách hàng: <span className="text-on-surface font-medium">{order.recipientName}</span>
                          </p>
                          <div className="flex items-center justify-between mt-1 text-label-sm">
                            <span className="font-bold text-emerald-700">
                              {formatVND(order.totalAmount || 0)}
                            </span>
                            <span className="text-secondary text-[11px]">
                              {order.items?.length || 1} sản phẩm
                            </span>
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-surface-container-low/40 border-t border-outline-variant/20 text-center">
                <Link
                  href="/seller/orders"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 text-body-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Xem tất cả đơn hàng</span>
                  <MaterialSymbol name="arrow_forward" size="[16px]" />
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Divider */}
          <div className="h-6 w-px bg-outline-variant/30" />

          {/* User & Shop Profile Badge with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                aria-label="Menu tài khoản người bán"
              >
                {/* Avatar / Logo */}
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-label-md text-label-md font-bold shadow-sm overflow-hidden flex-shrink-0">
                  {avatarImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarImage}
                      alt={finalStoreName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{finalInitials}</span>
                  )}
                </div>

                {/* Text Info */}
                <div className="hidden md:flex flex-col text-left max-w-[150px]">
                  <span className="font-headline-md text-body-sm text-on-surface font-semibold leading-tight truncate">
                    {finalStoreName}
                  </span>
                  <span className="font-body-sm text-label-sm text-secondary leading-tight truncate">
                    {storeRole}
                  </span>
                </div>

                {/* Dropdown Chevron Icon */}
                <div className="w-7 h-7 rounded-full bg-surface-container text-secondary flex items-center justify-center ml-0.5 transition-transform">
                  <MaterialSymbol name="expand_more" size="[18px]" />
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-72 p-2 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl z-50 animate-in fade-in-80 zoom-in-95"
            >
              {/* Header: Thông tin cá nhân & Gian hàng */}
              <DropdownMenuLabel className="p-3 bg-surface-container-low/70 rounded-xl mb-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm overflow-hidden flex-shrink-0">
                    {avatarImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarImage}
                        alt={userData?.fullName || finalStoreName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{finalInitials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline-md text-body-md text-on-surface font-bold truncate">
                      {userData?.fullName || finalStoreName}
                    </p>
                    <p className="font-body-sm text-label-sm text-secondary truncate">
                      {userData?.email || "Chưa có email"}
                    </p>
                    {userData?.phone && (
                      <p className="font-body-sm text-[11px] text-outline truncate">
                        SĐT: {userData.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Gian hàng chi tiết mini card */}
                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2 text-label-sm">
                  <div className="min-w-0">
                    <span className="text-secondary block text-[11px]">Gian hàng:</span>
                    <span className="font-semibold text-on-surface truncate block">
                      {finalStoreName}
                    </span>
                    {finalStoreCode && (
                      <span className="text-[10px] text-outline block">
                        Mã: {finalStoreCode}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border ${
                      isApproved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {storeStatusText}
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1 bg-outline-variant/20" />

              {/* Navigation items */}
              <DropdownMenuItem asChild>
                <Link
                  href="/seller/profile"
                  className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                >
                  <MaterialSymbol name="storefront" size="[18px]" className="text-emerald-600" />
                  <span className="font-medium">Hồ sơ gian hàng</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/account"
                  className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                >
                  <MaterialSymbol name="person" size="[18px]" className="text-secondary" />
                  <span className="font-medium">Tài khoản cá nhân</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/account?tab=password"
                  className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                >
                  <MaterialSymbol name="lock" size="[18px]" className="text-secondary" />
                  <span className="font-medium">Đổi mật khẩu</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-secondary hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                >
                  <MaterialSymbol name="open_in_new" size="[18px]" className="text-secondary" />
                  <span>Về sàn mua sắm</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-outline-variant/20" />

              {/* Nút Đăng xuất */}
              <DropdownMenuItem
                disabled={isLoggingOut}
                onSelect={(e) => {
                  e.preventDefault();
                  logout();
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-error hover:bg-error-container/20 hover:text-error rounded-lg transition-colors cursor-pointer font-semibold"
              >
                <MaterialSymbol name="logout" size="[18px]" className="text-error" />
                <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

