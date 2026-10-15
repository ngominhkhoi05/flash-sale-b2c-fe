"use client";

import React, { useState, useTransition, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ReconciliationOrder,
  ReconciliationRefund,
} from "@/types/reconciliation";
import { reconciliationMockService } from "@/lib/mocks/reconciliation.mock";
import {
  ReconciliationOrdersTable,
  ReconciliationRefundsTable,
  ReconciliationWalletTab,
  ReconciliationAnalyticsCards,
} from "@/components/admin/reconciliation";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

function ReconciliationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "orders";

  const [, startTransition] = useTransition();

  // Tab state
  const [activeTab, setActiveTab] = useState<string>(
    ["orders", "refunds", "wallet"].includes(initialTab) ? initialTab : "orders"
  );

  // Period state
  const [selectedPeriod, setSelectedPeriod] = useState("09/2026");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modals & action states
  const [isLockPeriodModalOpen, setIsLockPeriodModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] =
    useState<ReconciliationOrder | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Sync tab with URL
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setPage(0);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabKey);
    router.replace(`/admin/reconciliation?${params.toString()}`);
  };

  // KPIs
  const kpis = useMemo(() => {
    return reconciliationMockService.getKpis();
  }, []);

  // Filtered Orders Data
  const ordersData = useMemo(() => {
    return reconciliationMockService.getOrders({
      search: searchQuery,
      storeId: storeFilter || undefined,
      paymentMethod: paymentMethodFilter || undefined,
      status: statusFilter || undefined,
      page,
      pageSize,
    });
  }, [searchQuery, storeFilter, paymentMethodFilter, statusFilter, page, pageSize]);

  // Filtered Refunds Data
  const refundsData = useMemo(() => {
    return reconciliationMockService.getRefunds({
      search: searchQuery,
    });
  }, [searchQuery]);

  // Handle CSV Export
  const handleExportCsv = () => {
    try {
      const allOrders = reconciliationMockService.getOrders({
        search: searchQuery,
        storeId: storeFilter || undefined,
        paymentMethod: paymentMethodFilter || undefined,
        status: statusFilter || undefined,
        page: 0,
        pageSize: 1000,
      }).items;

      const csvContent = reconciliationMockService.exportCsv(allOrders);
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `doi-soat-tai-chinh-${selectedPeriod.replace("/", "-")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(
        `Đã xuất thành công file CSV ${allOrders.length} giao dịch đối soát`
      );
    } catch {
      showToast("Có lỗi xảy ra khi tạo tệp CSV xuất báo cáo");
    }
  };

  // Handle Sync Wallet
  const handleSyncWallet = () => {
    showToast("Đang đồng bộ giao dịch ví shop kỳ T+3...");
    setTimeout(() => {
      showToast("Đồng bộ hoàn tất! 318 giao dịch ví shop đã khớp lệnh.");
    }, 1200);
  };

  // Handle Lock Period Confirm
  const handleConfirmLockPeriod = () => {
    startTransition(() => {
      setIsLockPeriodModalOpen(false);
      showToast(
        `Đã khóa sổ thành công kỳ đối soát Tháng ${selectedPeriod}. Biên bản đối soát đã được lưu trữ an toàn.`
      );
    });
  };

  return (
    <div className="flex flex-col gap-space-lg min-h-full pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-space-sm bg-surface-container-highest text-on-surface border border-outline-variant/30 px-4 py-3 rounded-xl shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            check_circle
          </span>
          <span className="font-body-md text-sm font-medium">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface tracking-tight">
              Đối soát tài chính & Doanh thu sàn
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-primary border border-primary/20">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Chu kỳ T+3
            </span>
          </div>
          <p className="font-body-md text-sm text-secondary mt-1">
            Tổng hợp doanh thu GMV, phí hoa hồng nền tảng, số dư hoàn tiền và
            đối soát tự động ví gian hàng.
          </p>
        </div>

        {/* Period Selector & Actions */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Period Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="material-symbols-outlined text-secondary text-[18px]">
              calendar_month
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                showToast(`Đã chuyển sang kỳ đối soát Tháng ${e.target.value}`);
              }}
              className="bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="10/2026">Tháng 10/2026 (Kỳ hiện tại)</option>
              <option value="09/2026">Tháng 09/2026 (Đã chốt T+3)</option>
              <option value="08/2026">Tháng 08/2026 (Lưu trữ)</option>
              <option value="07/2026">Tháng 07/2026 (Lưu trữ)</option>
            </select>
          </div>

          {/* History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-xs font-semibold shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">
              history
            </span>
            <span>Lịch sử khóa sổ</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-xs font-semibold shadow-sm"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">
              download
            </span>
            <span>Xuất báo cáo (CSV)</span>
          </button>

          {/* Lock Period Button */}
          <button
            type="button"
            onClick={() => setIsLockPeriodModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-label-md text-xs font-semibold shadow transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              lock
            </span>
            <span>Khóa sổ kỳ {selectedPeriod}</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* KPI 1: GMV */}
        <div className="relative flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm hover:border-primary/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-xs font-medium text-secondary uppercase tracking-wider">
                Tổng giá trị đơn thành công
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-headline-lg text-2xl font-bold text-on-surface tracking-tight">
                  32,60
                </span>
                <span className="font-label-md text-sm font-semibold text-secondary">
                  tỷ₫
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[22px]">
                payments
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-outline-variant/10">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="material-symbols-outlined text-[14px]">
                trending_up
              </span>
              +{kpis.gmvGrowthPercent}% vs tháng trước
            </span>
            <span className="text-secondary font-mono text-[11px]">
              {kpis.ordersCount.toLocaleString()} đơn
            </span>
          </div>
        </div>

        {/* KPI 2: Platform Commission */}
        <div className="relative flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm hover:border-primary/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-xs font-medium text-secondary uppercase tracking-wider">
                Hoa hồng sàn thực thu
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-headline-lg text-2xl font-bold text-primary tracking-tight">
                  1,63
                </span>
                <span className="font-label-md text-sm font-semibold text-secondary">
                  tỷ₫
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[22px]">
                account_balance
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-outline-variant/10">
            <span className="text-secondary font-medium">
              Tỉ lệ hoa hồng TB:{" "}
              <strong className="text-on-surface">
                {kpis.commissionPercent}%
              </strong>
            </span>
            <span className="text-primary font-semibold text-[11px] bg-primary/10 px-1.5 py-0.5 rounded">
              Doanh thu Net
            </span>
          </div>
        </div>

        {/* KPI 3: Shop Wallet Settlement */}
        <div className="relative flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm hover:border-primary/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-xs font-medium text-secondary uppercase tracking-wider">
                Đã chuyển vào ví shop
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-headline-lg text-2xl font-bold text-on-surface tracking-tight">
                  30,97
                </span>
                <span className="font-label-md text-sm font-semibold text-secondary">
                  tỷ₫
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <span className="material-symbols-outlined text-[22px]">
                account_balance_wallet
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-outline-variant/10">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {kpis.shopWalletSettledPercent}% đã giải ngân T+3
            </span>
            <span className="text-secondary font-mono text-[11px]">
              {kpis.walletTransCount} shop
            </span>
          </div>
        </div>

        {/* KPI 4: Refund Amount */}
        <div className="relative flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm hover:border-primary/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-xs font-medium text-secondary uppercase tracking-wider">
                Hoàn tiền phát sinh
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-headline-lg text-2xl font-bold text-tertiary tracking-tight">
                  84,2
                </span>
                <span className="font-label-md text-sm font-semibold text-secondary">
                  triệu₫
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary">
              <span className="material-symbols-outlined text-[22px]">
                currency_exchange
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-outline-variant/10">
            <span className="text-secondary font-medium">
              Tỉ lệ hoàn tiền:{" "}
              <strong className="text-tertiary">
                {kpis.refundRatePercent}%
              </strong>
            </span>
            <span className="text-tertiary font-semibold text-[11px] bg-tertiary/10 px-1.5 py-0.5 rounded">
              {kpis.refundsCount} giao dịch
            </span>
          </div>
        </div>
      </div>

      {/* Settlement Workflow Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-start gap-space-sm">
          <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">
            verified
          </span>
          <div>
            <h4 className="font-body-md text-sm font-bold text-on-surface">
              Quy trình đối soát T+3 tự động cho người bán
            </h4>
            <p className="font-body-sm text-xs text-secondary mt-0.5">
              Sau 3 ngày kể từ khi đơn hàng được giao thành công và khách hàng
              hết hạn khiếu nại đổi trả, hệ thống tự động trừ phí hoa hồng sàn
              (4-5%) và cộng tiền thực nhận vào Ví gian hàng (Store Wallet).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSyncWallet}
          className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-surface-container-lowest text-primary hover:bg-primary/10 transition-colors font-label-md text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-[16px]">sync</span>
          <span>Đồng bộ ví ngay</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-outline-variant/30">
        <button
          type="button"
          onClick={() => handleTabChange("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 font-label-md text-sm font-semibold border-b-2 transition-all ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-secondary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            receipt_long
          </span>
          <span>Đơn hàng & hoa hồng</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "orders"
                ? "bg-primary-fixed text-primary"
                : "bg-surface-container-low text-secondary"
            }`}
          >
            24.180
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("refunds")}
          className={`flex items-center gap-2 px-4 py-2.5 font-label-md text-sm font-semibold border-b-2 transition-all ${
            activeTab === "refunds"
              ? "border-primary text-primary"
              : "border-transparent text-secondary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            currency_exchange
          </span>
          <span>Hoàn tiền & thu hồi</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "refunds"
                ? "bg-tertiary-fixed text-tertiary"
                : "bg-surface-container-low text-secondary"
            }`}
          >
            142
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("wallet")}
          className={`flex items-center gap-2 px-4 py-2.5 font-label-md text-sm font-semibold border-b-2 transition-all ${
            activeTab === "wallet"
              ? "border-primary text-primary"
              : "border-transparent text-secondary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            account_balance_wallet
          </span>
          <span>Giao dịch ví shop</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "wallet"
                ? "bg-surface-container-high text-on-surface"
                : "bg-surface-container-low text-secondary"
            }`}
          >
            318
          </span>
        </button>
      </div>

      {/* Tab Filter Toolbar (for orders and refunds) */}
      {activeTab !== "wallet" && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm">
          <div className="flex flex-wrap items-center gap-space-sm flex-1">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={
                  activeTab === "orders"
                    ? "Tìm mã đơn hàng, gian hàng..."
                    : "Tìm mã đơn hoàn, tên khách hàng..."
                }
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-outline-variant/60 bg-surface-bright font-body-sm text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              )}
            </div>

            {/* Store Filter (Only for orders) */}
            {activeTab === "orders" && (
              <select
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setPage(0);
                }}
                className="h-9 px-3 rounded-lg border border-outline-variant/60 bg-surface-bright font-body-sm text-sm text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Tất cả gian hàng</option>
                <option value="store-01">Coolmate Official</option>
                <option value="store-02">TechSound Global</option>
                <option value="store-03">OralCare VN</option>
                <option value="store-04">Sunhouse Mall</option>
                <option value="store-05">GUMAC Fashion</option>
              </select>
            )}

            {/* Payment Method Filter (Only for orders) */}
            {activeTab === "orders" && (
              <select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setPage(0);
                }}
                className="h-9 px-3 rounded-lg border border-outline-variant/60 bg-surface-bright font-body-sm text-sm text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Tất cả PTTT</option>
                <option value="ZALOPAY">ZaloPay QR</option>
                <option value="COD">COD Tiền mặt</option>
              </select>
            )}

            {/* Status Filter (Only for orders) */}
            {activeTab === "orders" && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="h-9 px-3 rounded-lg border border-outline-variant/60 bg-surface-bright font-body-sm text-sm text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="SETTLED">Đã ghi sổ ví (SETTLED)</option>
                <option value="PENDING_DELIVERY">
                  Chờ giao hàng (PENDING)
                </option>
              </select>
            )}

            {/* Reset Filter Button */}
            {(searchQuery || storeFilter || paymentMethodFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStoreFilter("");
                  setPaymentMethodFilter("");
                  setStatusFilter("");
                  setPage(0);
                }}
                className="h-9 px-3 rounded-lg text-secondary hover:text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  filter_alt_off
                </span>
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-space-xs text-xs text-secondary self-end lg:self-center">
            <span>
              Hiển thị: <strong>{ordersData.items.length}</strong> /{" "}
              {ordersData.total} đơn đối soát
            </span>
          </div>
        </div>
      )}

      {/* Tab 1: Orders and Commission Table */}
      {activeTab === "orders" && (
        <ReconciliationOrdersTable
          orders={ordersData.items}
          totalCount={ordersData.total}
          totals={ordersData.totals}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(0);
          }}
          onViewOrder={(order) => {
            setSelectedOrderForView(order);
          }}
        />
      )}

      {/* Tab 2: Refunds Table */}
      {activeTab === "refunds" && (
        <ReconciliationRefundsTable
          refunds={refundsData}
          onViewRefund={(refund: ReconciliationRefund) => {
            showToast(
              `Đơn hoàn ${refund.orderCode}: ${refund.reason} (${refund.refundAmount.toLocaleString()}₫)`
            );
          }}
        />
      )}

      {/* Tab 3: Store Wallet Transaction Placeholder */}
      {activeTab === "wallet" && <ReconciliationWalletTab />}

      {/* Analytics Cards at page bottom */}
      <ReconciliationAnalyticsCards />

      {/* Lock Period Confirm Modal */}
      <ConfirmModal
        isOpen={isLockPeriodModalOpen}
        onClose={() => setIsLockPeriodModalOpen(false)}
        onConfirm={handleConfirmLockPeriod}
        title={`Khóa sổ kỳ đối soát Tháng ${selectedPeriod}`}
        subtitle="Hành động này sẽ chốt toàn bộ số liệu doanh thu và phát hành biên bản đối soát điện tử."
        confirmButtonText="Xác nhận khóa sổ"
        variant="primary"
        warningMessage="Sau khi khóa sổ, các điều chỉnh hoa hồng hoặc chi trả bổ sung sẽ được kết chuyển sang kỳ kế tiếp."
      />

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  history_edu
                </span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  Lịch sử các kỳ đối soát đã khóa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-secondary hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="space-y-3 font-body-sm text-sm">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-on-surface">
                    Kỳ Tháng 08/2026
                  </div>
                  <div className="text-xs text-secondary">
                    Khóa ngày 03/09/2026 • Ký bởi Admin VibeMart
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                  Đã tất toán
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-on-surface">
                    Kỳ Tháng 07/2026
                  </div>
                  <div className="text-xs text-secondary">
                    Khóa ngày 03/08/2026 • Ký bởi Admin VibeMart
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                  Đã tất toán
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(false)}
              className="mt-2 w-full py-2.5 rounded-xl border border-outline-variant/60 font-label-md text-sm font-semibold hover:bg-surface-container-low transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Order View Modal */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  receipt_long
                </span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  Chi tiết đơn {selectedOrderForView.orderCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForView(null)}
                className="text-secondary hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="space-y-2.5 font-body-sm text-sm">
              <div className="flex justify-between py-1 border-b border-outline-variant/10">
                <span className="text-secondary">Gian hàng:</span>
                <span className="font-semibold text-on-surface">
                  {selectedOrderForView.storeName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/10">
                <span className="text-secondary">Ngày chốt:</span>
                <span className="font-medium text-on-surface">
                  {selectedOrderForView.settlementDate}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/10">
                <span className="text-secondary">Phương thức:</span>
                <span className="font-medium text-on-surface">
                  {selectedOrderForView.paymentMethod === "ZALOPAY"
                    ? "ZaloPay QR"
                    : "COD Tiền mặt"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/10">
                <span className="text-secondary">Tổng tiền đơn:</span>
                <span className="font-semibold text-on-surface">
                  {selectedOrderForView.totalAmount.toLocaleString()}₫
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/10">
                <span className="text-secondary">Tỉ lệ hoa hồng sàn:</span>
                <span className="font-semibold text-primary">
                  {selectedOrderForView.commissionRate}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/10">
                <span className="text-secondary">Phí hoa hồng sàn thu:</span>
                <span className="font-bold text-primary">
                  {selectedOrderForView.platformFee.toLocaleString()}₫
                </span>
              </div>
              <div className="flex justify-between py-1 pt-2">
                <span className="text-secondary font-semibold">
                  Shop thực nhận:
                </span>
                <span className="font-bold text-base text-emerald-600">
                  {selectedOrderForView.shopEarnings.toLocaleString()}₫
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderForView(null)}
              className="mt-2 w-full py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReconciliationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-secondary text-sm">
          Đang tải dữ liệu đối soát tài chính...
        </div>
      }
    >
      <ReconciliationPageContent />
    </Suspense>
  );
}
