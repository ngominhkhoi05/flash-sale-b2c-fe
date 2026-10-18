"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { useMyVouchers, useSaveVoucher } from "@/features/vouchers/hooks";
import type { UserVoucher } from "@/features/vouchers/types";
import { formatVND } from "@/lib/format";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type VoucherTab = "all" | "platform" | "shop" | "expiring" | "used";

interface UiVoucherItem {
  id: string;
  code: string;
  title: string;
  type: "platform" | "shop";
  storeName?: string;
  discountLabel: string;
  minOrderLabel: string;
  usedPercent: number;
  expiryLabel: string;
  expiringInHours?: number;
  status: "ACTIVE" | "USED" | "EXPIRED";
  terms: string;
}

export function VoucherWalletClient() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<VoucherTab>("all");
  const [inputCode, setInputCode] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<string | null>(null);

  const { data: myVouchers, isLoading } = useMyVouchers();
  const saveMutation = useSaveVoucher();

  // Chuyển đổi dữ liệu 100% từ backend Database
  const vouchersList: UiVoucherItem[] = useMemo(() => {
    if (!myVouchers || myVouchers.length === 0) {
      return [];
    }

    return myVouchers.map((v: UserVoucher) => {
      const isPlatform = v.scope === "SHIPPING" || v.type === "FREESHIP";
      const usedPct = v.userUsageLimit
        ? Math.min(Math.round((v.userUsageCount / v.userUsageLimit) * 100), 100)
        : 0;

      // Tính giờ còn lại nếu có endTime
      let expiringHours: number | undefined;
      if (v.endTime) {
        const msLeft = new Date(v.endTime).getTime() - Date.now();
        if (msLeft > 0 && msLeft <= 24 * 60 * 60 * 1000) {
          expiringHours = Math.ceil(msLeft / (60 * 60 * 1000));
        }
      }

      return {
        id: String(v.id),
        code: v.code,
        title: v.name || v.code,
        type: isPlatform ? "platform" : "shop",
        discountLabel:
          v.discountUnit === "PERCENT"
            ? `Giảm ${v.discountValue}%${v.maxDiscountAmount ? ` tối đa ${formatVND(v.maxDiscountAmount)}` : ""}`
            : `Giảm ${formatVND(v.discountValue)}`,
        minOrderLabel: `Đơn tối thiểu ${formatVND(v.minOrderAmount)}`,
        usedPercent: usedPct,
        expiryLabel: `HSD: ${v.endTime ? v.endTime.split("T")[0] : "Chưa xác định"}`,
        expiringInHours: expiringHours,
        status: v.status as any,
        terms: v.description || "Áp dụng theo quy chế khuyến mại của Vibe Mart.",
      };
    });
  }, [myVouchers]);

  // Lọc theo tab
  const filteredVouchers = useMemo(() => {
    switch (activeTab) {
      case "platform":
        return vouchersList.filter((v) => v.type === "platform" && v.status === "ACTIVE");
      case "shop":
        return vouchersList.filter((v) => v.type === "shop" && v.status === "ACTIVE");
      case "expiring":
        return vouchersList.filter((v) => v.status === "ACTIVE" && Boolean(v.expiringInHours));
      case "used":
        return vouchersList.filter((v) => v.status === "USED" || v.status === "EXPIRED");
      case "all":
      default:
        return vouchersList.filter((v) => v.status === "ACTIVE");
    }
  }, [vouchersList, activeTab]);

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      toast.error("Vui lòng nhập mã voucher");
      return;
    }
    saveMutation.mutate(inputCode.trim().toUpperCase(), {
      onSuccess: () => setInputCode(""),
    });
  };

  const tabs: { key: VoucherTab; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "platform", label: "Voucher Vibe Mart" },
    { key: "shop", label: "Voucher shop" },
    { key: "expiring", label: "Sắp hết hạn" },
    { key: "used", label: "Đã dùng / Hết hạn" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Menu trái 240px */}
        <div className="lg:col-span-3">
          <AccountSidebar
            activeItem="vouchers"
            displayName={user?.fullName}
            email={user?.email}
            avatarUrl={user?.avatarUrl}
            voucherCount={vouchersList.filter((v) => v.status === "ACTIVE").length}
          />
        </div>

        {/* Cột phải: Kho voucher */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          {/* Header & Nhập mã voucher */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MaterialSymbol name="confirmation_number" size="[22px]" />
              </div>
              <h1 className="text-xl font-bold text-on-surface">Kho voucher của tôi</h1>
            </div>

            <form onSubmit={handleSaveVoucher} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Nhập mã voucher"
                className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-sm font-mono border border-outline-variant uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
              >
                {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
              </button>
            </form>
          </section>

          {/* Thanh Tab lọc */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-outline-variant/30">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0",
                    isActive
                      ? "bg-[#0284C7] text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-36 rounded-2xl bg-surface-container animate-pulse" />
              <div className="h-36 rounded-2xl bg-surface-container animate-pulse" />
            </div>
          ) : filteredVouchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVouchers.map((v) => {
                const isInactive = v.status === "USED" || v.status === "EXPIRED";
                const isPlatform = v.type === "platform";

                return (
                  <div
                    key={v.id}
                    className={cn(
                      "relative flex rounded-2xl overflow-hidden border transition-all shadow-xs",
                      isInactive
                        ? "bg-neutral-100 border-neutral-300 opacity-60 grayscale"
                        : "bg-surface-container-lowest border-outline-variant/40 hover:shadow-md"
                    )}
                  >
                    {/* Phần trái cuống vé răng cưa */}
                    <div
                      className={cn(
                        "w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center p-3 text-center relative",
                        isPlatform
                          ? "bg-[#0284C7] text-white"
                          : "bg-[#E0F2FE] text-[#0369A1]"
                      )}
                    >
                      <div className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-surface-container-lowest" />
                      <div className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-surface-container-lowest" />

                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1.5 shadow-inner">
                        <MaterialSymbol
                          name={isPlatform ? "local_mall" : "storefront"}
                          size="[22px]"
                        />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider leading-tight">
                        {isPlatform ? "Vibe Mart" : v.storeName?.slice(0, 10) || "Shop"}
                      </span>
                      <span className="text-[9px] opacity-80 mt-0.5">Voucher</span>
                    </div>

                    <div className="w-0 border-r border-dashed border-outline-variant/60 relative z-10" />

                    {/* Phần phải chi tiết */}
                    <div className="flex-1 p-3.5 flex flex-col justify-between">
                      <div>
                        {v.expiringInHours && !isInactive && (
                          <div className="mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-container text-error">
                            <MaterialSymbol name="schedule" size="[12px]" />
                            Còn {v.expiringInHours} giờ
                          </div>
                        )}

                        <h3 className="font-bold text-sm text-on-surface leading-tight">
                          {v.discountLabel}
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {v.minOrderLabel}
                        </p>
                      </div>

                      {!isInactive && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                            <span>Đã dùng {v.usedPercent}%</span>
                            <span className="font-mono">{v.expiryLabel}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                            <div
                              className="h-full bg-[#0284C7] rounded-full transition-all"
                              style={{ width: `${v.usedPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedTerms(v.terms)}
                          className="text-[11px] font-medium text-on-surface-variant hover:text-primary hover:underline"
                        >
                          Điều kiện
                        </button>

                        {!isInactive ? (
                          <Link
                            href="/flash-sale"
                            className="px-3.5 py-1 rounded-lg bg-[#0284C7] text-white text-xs font-bold shadow-xs hover:bg-sky-700 transition-colors"
                          >
                            Dùng ngay
                          </Link>
                        ) : (
                          <span className="text-xs font-bold text-neutral-500">
                            {v.status === "USED" ? "ĐÃ SỬ DỤNG" : "HẾT HẠN"}
                          </span>
                        )}
                      </div>
                    </div>

                    {isInactive && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-neutral-400 text-neutral-500 px-4 py-1 rounded-xl font-extrabold text-sm tracking-widest uppercase rotate-[-15deg] pointer-events-none">
                        {v.status === "USED" ? "ĐÃ DÙNG" : "HẾT HẠN"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state khi database không có voucher nào */
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-outline-variant/30 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center mb-3">
                <MaterialSymbol name="confirmation_number" size="[32px]" />
              </div>
              <h3 className="text-base font-bold text-on-surface">Bạn chưa có voucher nào trong kho</h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                Hãy thu thập voucher từ các phiên Flash Sale hoặc nhập mã ưu đãi từ shop để được giảm giá khi thanh toán.
              </p>
              <Link
                href="/flash-sale"
                className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
              >
                Khám phá voucher Flash Sale
              </Link>
            </div>
          )}
        </main>
      </div>

      {selectedTerms && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <header className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <h4 className="font-bold text-base text-on-surface">Điều kiện sử dụng</h4>
              <button
                type="button"
                onClick={() => setSelectedTerms(null)}
                className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-container-high"
              >
                <MaterialSymbol name="close" size="[16px]" />
              </button>
            </header>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              {selectedTerms}
            </p>
            <button
              type="button"
              onClick={() => setSelectedTerms(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
