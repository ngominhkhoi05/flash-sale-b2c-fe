/**
 * CheckoutPageContent – Composite page content for /checkout.
 *
 * Layout:
 *  - Header: CheckoutHeader (sticky, includes 3-step stepper)
 *  - Main:   Left col 8/12 (address + split banner + shop cards + voucher +
 *            payment + VibeCare)  |  Right col 4/12 (sticky OrderSummary)
 *  - Mobile: Single column + sticky bottom submit bar
 *  - Modals: AddressPickerModal, VoucherPickerModal
 *
 * Stitch reference: ui-code-dump.md L1–687.
 */
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ROUTES } from "@/lib/constants";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  Address,
  CheckoutData,
  CheckoutShopGroup,
  PaymentMethod,
  Voucher,
} from "@/features/checkout";
import {
  mockCheckoutData,
  useApplyVoucherMutation,
  useAvailableVouchers,
  useCheckout,
  useSubmitOrderMutation,
} from "@/features/checkout";

import { CheckoutAddressCard } from "./CheckoutAddressCard";
import { CheckoutSplitOrderBanner } from "./CheckoutSplitOrderBanner";
import { CheckoutShopCard } from "./CheckoutShopCard";
import { CheckoutVibeMartVoucherCard } from "./CheckoutVibeMartVoucherCard";
import { CheckoutPaymentMethodCard } from "./CheckoutPaymentMethodCard";
import { CheckoutVibeCareBanner } from "./CheckoutVibeCareBanner";
import { CheckoutOrderSummary, CheckoutOrderSummaryLine } from "./CheckoutOrderSummary";
import { AddressPickerModal } from "./AddressPickerModal";
import { VoucherPickerModal } from "./VoucherPickerModal";

interface CheckoutPageContentProps {
  /**
   * Nếu backend chưa sẵn sàng, cho phép dùng mock data để dev UI.
   * Mặc định: bật mock để phục vụ stitch demo.
   */
  useMockData?: boolean;
}

export function CheckoutPageContent({
  useMockData = false,
}: CheckoutPageContentProps) {
  const t = useTranslations("storefront.checkout");
  const router = useRouter();

  // ── Data fetching ──────────────────────────────────────────────
  const checkoutQuery = useCheckout(!useMockData);
  const data: CheckoutData = useMockData
    ? mockCheckoutData
    : (checkoutQuery.data ?? mockCheckoutData);

  // ── Local UI state ─────────────────────────────────────────────
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    data.selectedAddress,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    data.paymentMethod,
  );
  const [appliedPlatformVoucher, setAppliedPlatformVoucher] =
    useState<Voucher | null>(data.appliedPlatformVoucher);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [vibecare, setVibecare] = useState(false);

  // ── Real API: fetch available platform vouchers ──────────────
  const platformVouchersQuery = useAvailableVouchers("PLATFORM");
  const availablePlatformVouchers: Voucher[] = useMockData
    ? [
        {
          id: 1,
          code: "FREESHIP50K",
          label: "Miễn phí vận chuyển tối đa 50K",
          shortDescription: "Đơn từ 0₫",
          scope: "PLATFORM",
          discountAmount: 50000,
          expiresAtLabel: "30/12/2026",
          status: "ACTIVE",
        },
        {
          id: 2,
          code: "VIBE30K",
          label: "VIBE30K – Giảm 30K",
          shortDescription: "Đơn từ 1.000.000₫",
          scope: "PLATFORM",
          discountAmount: 30000,
          minOrderValue: 1000000,
          expiresAtLabel: "14/10/2026",
          status: "ACTIVE",
        },
        {
          id: 3,
          code: "MEGA100K",
          label: "MEGA100K – Giảm 100K",
          shortDescription: "Đơn từ 2.000.000₫",
          scope: "PLATFORM",
          discountAmount: 100000,
          minOrderValue: 2000000,
          expiresAtLabel: "30/11/2026",
          status: "EXPIRED",
        },
        {
          id: 4,
          code: "WELCOME15",
          label: "WELCOME15 – Giảm 15%",
          shortDescription: "Đơn đầu tiên",
          scope: "PLATFORM",
          discountPercent: 0.15,
          maxDiscount: 50000,
          expiresAtLabel: "01/01/2027",
          status: "ACTIVE",
        },
      ]
    : (platformVouchersQuery.data ?? []);

  // ── Mutations ──────────────────────────────────────────────────
  const applyVoucherMut = useApplyVoucherMutation();
  const submitMut = useSubmitOrderMutation();

  // ── Derived ────────────────────────────────────────────────────
  const shopGroups: CheckoutShopGroup[] = data.shopGroups;

  const subtotal = useMemo(
    () =>
      shopGroups.reduce((sum, g) => sum + Number(g.shopSubtotal ?? 0), 0),
    [shopGroups],
  );
  const shippingFee = useMemo(
    () => shopGroups.reduce((sum, g) => sum + Number(g.shippingFee ?? 0), 0),
    [shopGroups],
  );
  const shopVoucherDiscount = useMemo(
    () =>
      shopGroups.reduce(
        (sum, g) => sum + Number(g.appliedShopVoucher?.discountAmount ?? 0),
        0,
      ),
    [shopGroups],
  );
  const platformVoucherDiscount = appliedPlatformVoucher
    ? Number(appliedPlatformVoucher.discountAmount ?? 0)
    : 0;
  const totalDiscount = shopVoucherDiscount + platformVoucherDiscount;
  const vibecareFee = vibecare ? 15000 * shopGroups.length : 0;
  const grandTotal = Math.max(
    0,
    subtotal + shippingFee + vibecareFee - totalDiscount,
  );

  // ── Handlers ───────────────────────────────────────────────────
  const handleSelectAddress = (addr: Address) => {
    // Local-only: backend uses selectedAddress implicitly via addressId at submit time.
    setSelectedAddress(addr);
  };

  const handleApplyVoucherCode = async (code: string) => {
    setVoucherError(null);
    // Simple in-mock validation: must be in available platform vouchers.
    const match = availablePlatformVouchers.find(
      (v) => v.code.toUpperCase() === code.toUpperCase(),
    );
    if (!match) {
      setVoucherError(`Mã "${code}" không hợp lệ hoặc đã hết hạn.`);
      return;
    }
    if (match.isDisabled) {
      setVoucherError(match.disabledReason ?? "Mã chưa đủ điều kiện áp dụng.");
      return;
    }
    if (useMockData) {
      setAppliedPlatformVoucher(match);
      return;
    }
    try {
      const res = await applyVoucherMut.mutateAsync({
        voucherCode: match.code,
        orderAmount: subtotal,
      });
      if (res.applied) {
        setAppliedPlatformVoucher(res.voucher);
      } else {
        setVoucherError("Mã không áp dụng được cho đơn này.");
      }
    } catch (err) {
      console.error("[checkout] applyVoucher", err);
      setVoucherError("Không thể áp dụng mã. Vui lòng thử lại.");
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedPlatformVoucher(null);
  };

  const handleChangePayment = (m: PaymentMethod) => {
    setPaymentMethod(m);
  };

  const handleChangeNote = (storeId: number, note: string) => {
    // Note sent at submit time (BE doesn't have a per-shop note endpoint yet).
    void storeId;
    void note;
  };

  const handleSubmit = async () => {
    if (!selectedAddress) return;
    if (useMockData) {
      // Mock flow: chuyển sang màn xác nhận
      router.push(`${ROUTES.ORDERS}?mock=checkout-success`);
      return;
    }
    try {
      const res = await submitMut.mutateAsync({
        payload: {
          addressId: selectedAddress.id,
          paymentMethod,
          platformVoucherCode: appliedPlatformVoucher?.code,
          shopSelections: shopGroups.map((g) => ({
            storeId: g.storeId,
            shopVoucherCode: g.appliedShopVoucher?.code,
            buyerNote: g.buyerNote,
          })),
          idempotencyKey: uuidv4(),
        },
        idempotencyKey: uuidv4(),
      });
      if (res.status === "PENDING_PAYMENT" && res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        router.push(`${ROUTES.ORDERS}/${res.orderCode}`);
      }
    } catch (err) {
      console.error("[checkout] submitOrder", err);
    }
  };

  // ── Summary lines ─────────────────────────────────────────────
  const summaryLines: CheckoutOrderSummaryLine[] = [
    {
      label: `Tạm tính (${data.totalItems} sản phẩm)`,
      value: formatVND(subtotal),
    },
    {
      label: `Phí vận chuyển (${data.totalOrders} đơn)`,
      value: formatVND(shippingFee),
    },
  ];
  if (shopVoucherDiscount > 0) {
    summaryLines.push({
      label: "Voucher shop",
      value: `−${formatVND(shopVoucherDiscount)}`,
      highlight: "sale",
    });
  }
  if (platformVoucherDiscount > 0) {
    summaryLines.push({
      label: `Voucher VibeMart (${appliedPlatformVoucher?.code})`,
      value: `−${formatVND(platformVoucherDiscount)}`,
      highlight: "sale",
    });
  }
  if (vibecare) {
    summaryLines.push({
      label: "VibeCare (gói bảo hành)",
      value: `+${formatVND(vibecareFee)}`,
      highlight: "secondary",
    });
  }

  const canSubmit = Boolean(selectedAddress) && !submitMut.isPending;
  const isInitialLoading = !useMockData && checkoutQuery.isLoading;

  return (
    <div
      className="bg-background min-h-screen pt-0 pb-32 md:pb-16"
      data-testid="checkout-page"
    >
      <div className="max-w-[1240px] mx-auto px-4 lg:px-8">
        {isInitialLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl bg-surface-container animate-pulse"
                />
              ))}
            </div>
            <div className="lg:col-span-4 h-96 rounded-xl bg-surface-container animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── Left column ─────────────────────────────────── */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {selectedAddress && (
                <CheckoutAddressCard
                  address={selectedAddress}
                  onChange={() => setShowAddressModal(true)}
                />
              )}

              {data.totalOrders > 1 && (
                <CheckoutSplitOrderBanner shopCount={data.totalOrders} />
              )}

              {shopGroups.map((group) => (
                <CheckoutShopCard
                  key={group.storeId}
                  group={group}
                  onChangeNote={handleChangeNote}
                />
              ))}

              <CheckoutVibeMartVoucherCard
                appliedVoucher={
                  appliedPlatformVoucher
                    ? {
                        ...appliedPlatformVoucher,
                        shortDescription:
                          appliedPlatformVoucher.label ?? "Voucher sàn",
                        expiresAtLabel: "30/12/2026",
                        status: "ACTIVE",
                        discountLabel: formatVND(
                          appliedPlatformVoucher.discountAmount ?? 0,
                        ),
                      }
                    : null
                }
                onApply={handleApplyVoucherCode}
                onRemove={handleRemoveVoucher}
                onOpenPicker={() => setShowVoucherModal(true)}
                errorMessage={voucherError ?? undefined}
                onClearError={() => setVoucherError(null)}
              />

              <CheckoutPaymentMethodCard
                value={paymentMethod}
                onChange={handleChangePayment}
                disabled={applyVoucherMut.isPending}
              />

              <CheckoutVibeCareBanner
                enabled={vibecare}
                onToggle={setVibecare}
                pricePerOrder="15.000₫/đơn"
              />
            </div>

            {/* ── Right column (sticky) ───────────────────────── */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-[156px] flex flex-col gap-4">
                <CheckoutOrderSummary
                  lines={summaryLines}
                  grandTotal={formatVND(grandTotal)}
                  paymentMethod={paymentMethod}
                  isSubmitting={submitMut.isPending}
                  hasError={submitMut.isError}
                  canSubmit={canSubmit}
                  onSubmit={handleSubmit}
                  vatNoticeText="Giá đã bao gồm VAT và thuế tiêu thụ đặc biệt (nếu có)."
                  guaranteeText="Được bảo chứng bởi ZaloPay – PCI DSS cấp 1"
                  termsText={
                    "Bằng việc nhấn <strong>Đặt hàng ngay</strong>, bạn đồng ý với <a href='/terms' class='text-primary underline'>Điều khoản sử dụng</a> của Vibe Mart."
                  }
                />

                <div className="bg-surface-container-low rounded-xl p-3 flex items-start gap-2 text-xs text-on-surface-variant">
                  <MaterialSymbol
                    name="verified_user"
                    size="base"
                    className="text-secondary shrink-0"
                  />
                  <p>
                    Thông tin thanh toán của bạn được mã hoá theo chuẩn{" "}
                    <strong className="text-secondary">PCI DSS cấp 1</strong> –
                    an toàn tuyệt đối.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile sticky bottom submit bar ─────────────────────── */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-outline-variant shadow-[0_-4px_12px_rgba(15,23,42,0.06)] p-3 md:hidden",
        )}
        data-testid="mobile-submit-bar"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase">
              {t("totalLabel", { defaultValue: "Tổng thanh toán" })}
            </span>
            <span className="text-lg font-bold text-primary tabular-nums">
              {formatVND(grandTotal)}
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-11 px-5"
            data-testid="mobile-submit-button"
          >
            {submitMut.isPending ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang đặt...</span>
              </>
            ) : (
              <>
                <span>Đặt hàng ngay</span>
                <MaterialSymbol name="arrow_forward" size="base" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <AddressPickerModal
        open={showAddressModal}
        addresses={data.addresses}
        selectedId={selectedAddress?.id}
        onSelect={handleSelectAddress}
        onAddNew={() => {
          setShowAddressModal(false);
          router.push(`${ROUTES.ACCOUNT}?action=add-address`);
        }}
        onClose={() => setShowAddressModal(false)}
      />

      <VoucherPickerModal
        open={showVoucherModal}
        vouchers={availablePlatformVouchers}
        appliedCode={appliedPlatformVoucher?.code ?? null}
        onSelect={(voucher) => {
          handleApplyVoucherCode(voucher.code);
          setShowVoucherModal(false);
        }}
        onClose={() => setShowVoucherModal(false)}
      />
    </div>
  );
}
