"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getSellerWallet,
  getSellerWalletTransactions,
  requestSellerWithdrawal,
} from "@/lib/api/seller";
import type {
  SellerWalletResponse,
  SellerWalletTransaction,
} from "@/types/seller";

type TxTabKey = "ALL" | "ORDER_SETTLEMENT" | "WITHDRAWAL";

export default function SellerWalletPage() {
  const [wallet, setWallet] = useState<SellerWalletResponse | null>(null);
  const [transactions, setTransactions] = useState<SellerWalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [currentTab, setCurrentTab] = useState<TxTabKey>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Withdrawal modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawNote, setWithdrawNote] = useState<string>("");
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const triggerReload = () => {
    setLoading(true);
    setReloadTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    let active = true;

    Promise.all([
      getSellerWallet(),
      getSellerWalletTransactions(0, 50, currentTab),
    ])
      .then(([walletData, txData]) => {
        if (active) {
          setWallet(walletData);
          setTransactions(txData.content || []);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : "Không thể tải dữ liệu ví";
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentTab, reloadTrigger]);

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (currentTab !== "ALL" && t.type !== currentTab) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const code = (t.transactionCode || "").toLowerCase();
        const order = (t.orderCode || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        if (!code.includes(q) && !order.includes(q) && !desc.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, currentTab, searchTerm]);

  // Handle withdraw
  const handleConfirmWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(withdrawAmount.replace(/\D/g, ""), 10);
    if (!amountNum || amountNum < 100000) {
      alert("Số tiền rút tối thiểu là 100.000 ₫");
      return;
    }
    if (wallet && amountNum > wallet.balance) {
      alert("Số tiền rút không được vượt quá số dư khả dụng");
      return;
    }

    setWithdrawLoading(true);
    try {
      await requestSellerWithdrawal({
        amount: amountNum,
        bankAccountNumber: wallet?.bankAccount?.accountNumber,
        note: withdrawNote,
      });
      showToast("Yêu cầu rút tiền thành công! Tiền sẽ về tài khoản trong 2-24 giờ làm việc.");
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      setWithdrawNote("");
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác rút tiền thất bại";
      alert(msg);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleExportStatement = () => {
    const headers = [
      "Thời gian",
      "Loại giao dịch",
      "Mã giao dịch",
      "Mã đơn hàng",
      "Mô tả",
      "Biến động",
      "Số dư cuối",
      "Trạng thái",
    ];
    const rows = filteredTxs.map((t) => [
      t.createdAt,
      t.type,
      t.transactionCode,
      t.orderCode || "",
      `"${t.description}"`,
      t.amount,
      t.balanceAfter,
      t.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `seller_wallet_statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất sao kê ví thành công!");
  };

  const formatVnd = (amount?: number) => {
    return (amount || 0).toLocaleString("vi-VN") + " ₫";
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "--:--";
    try {
      const d = new Date(dateStr);
      return `${d.getHours().toString().padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")} · ${d.getDate().toString().padStart(2, "0")}/${(
        d.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-xl transition-all animate-bounce">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/seller" className="hover:text-emerald-600 transition-colors">
          Kênh người bán
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Ví doanh thu</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ví doanh thu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý số dư bán hàng, theo dõi dòng tiền đối soát và rút tiền về tài khoản ngân hàng liên kết.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerReload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500 text-[18px]">
              refresh
            </span>
            Làm mới
          </button>
          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              account_balance_wallet
            </span>
            Rút tiền ngay
          </button>
        </div>
      </div>

      {/* Top 2 Cards: Wallet Balance & Bank Account */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Balance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Số dư khả dụng
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sẵn sàng rút
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {loading ? "..." : formatVnd(wallet?.balance)}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Đang chờ đối soát (Pending)</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {loading ? "..." : formatVnd(wallet?.pendingBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tổng đã rút thành công</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {loading ? "..." : formatVnd(wallet?.totalWithdrawn)}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Linked Bank Account */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  VCB
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {wallet?.bankAccount?.bankName || "Vietcombank"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {wallet?.bankAccount?.branch || "Chi nhánh chính"}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Đã xác thực
              </span>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-slate-50/75 border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {wallet?.bankAccount?.accountNumber || "1029 8839 ****"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {wallet?.bankAccount?.accountHolder || "NGUYEN VAN AN"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-400">Rút tiền miễn phí giao dịch sàn</span>
            <button
              onClick={() => showToast("Chức năng thay đổi tài khoản ngân hàng đang được bảo mật.")}
              className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit_square</span>
              Thay đổi tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Section Header & Tabs */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Lịch sử giao dịch</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ biến động số dư và quyết toán đơn hàng thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
              {[
                { key: "ALL", label: "Tất cả" },
                { key: "ORDER_SETTLEMENT", label: "Doanh thu bán hàng" },
                { key: "WITHDRAWAL", label: "Rút tiền" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCurrentTab(tab.key as TxTabKey)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    currentTab === tab.key
                      ? "bg-white text-emerald-700 font-bold shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportStatement}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-slate-500 text-[16px]">
                download
              </span>
              Xuất sao kê
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã giao dịch, mã đơn..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <span className="material-symbols-outlined animate-spin text-emerald-600 text-[32px]">
              progress_activity
            </span>
            <p className="text-xs font-medium">Đang tải lịch sử giao dịch...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
            <button
              onClick={triggerReload}
              className="mt-2 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Thử lại
            </button>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <span className="material-symbols-outlined mb-2 text-[32px]">
              receipt_long
            </span>
            <p className="text-sm font-semibold text-slate-700">Chưa có giao dịch nào</p>
            <p className="text-xs text-slate-400 mt-1">
              Các giao dịch bán hàng hoặc rút tiền sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Loại GD</th>
                  <th className="py-3 px-4">Mã giao dịch / Đơn</th>
                  <th className="py-3 px-4 min-w-[240px]">Mô tả diễn giải</th>
                  <th className="py-3 px-4 text-right">Biến động</th>
                  <th className="py-3 px-4 text-right">Số dư cuối</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.map((t) => {
                  const isPositive = t.amount > 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(t.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        {t.type === "ORDER_SETTLEMENT" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Doanh thu đơn
                          </span>
                        )}
                        {t.type === "WITHDRAWAL" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Rút tiền
                          </span>
                        )}
                        {t.type === "REFUND" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            Hoàn trả
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-800">
                          {t.transactionCode}
                        </div>
                        {t.orderCode && (
                          <span className="text-[10px] text-slate-400">
                            Đơn: #{t.orderCode}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {t.description}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold font-mono text-sm ${
                            isPositive ? "text-emerald-600" : "text-slate-900"
                          }`}
                        >
                          {isPositive ? `+${formatVnd(t.amount)}` : formatVnd(t.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-800 font-mono">
                        {formatVnd(t.balanceAfter)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          {t.status === "SUCCESS" ? "Thành công" : t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsWithdrawModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_downward
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Yêu cầu rút tiền về tài khoản ngân hàng
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chuyển tiền nhanh 24/7 từ ví người bán
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="p-5 space-y-4 text-xs">
              {/* Destination Bank Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-slate-900">
                    {wallet?.bankAccount?.bankName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {wallet?.bankAccount?.accountNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-900">
                    {wallet?.bankAccount?.accountHolder}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-800">
                    Số tiền muốn rút (₫) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount((wallet?.balance || 0).toString())}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    Rút tất cả ({formatVnd(wallet?.balance)})
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="100000"
                    max={wallet?.balance || 0}
                    step="10000"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Tối thiểu 100.000 ₫"
                    className="w-full p-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₫
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hạn mức rút tối thiểu: 100.000 ₫/lần. Miễn phí giao dịch.
                </p>
              </div>

              {/* Note */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Ghi chú rút tiền (tùy chọn)
                </label>
                <input
                  type="text"
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder="Ví dụ: Rút doanh thu đợt 1 tháng 10"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Advisory note */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 flex-shrink-0 mt-0.5 text-[18px]">
                  info
                </span>
                <p className="text-[11px] leading-relaxed">
                  Lệnh rút tiền sẽ được xử lý tự động qua cổng thanh toán liên ngân hàng Napas 24/7. Tiền dự kiến vào tài khoản trong vòng 2-24 giờ làm việc.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {withdrawLoading ? (
                    <span>Đang xử lý...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        verified
                      </span>
                      <span>Xác nhận rút tiền</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
