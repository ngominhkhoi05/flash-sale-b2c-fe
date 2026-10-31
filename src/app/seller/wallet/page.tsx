"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getSellerWallet,
  getSellerWalletTransactions,
  requestSellerWithdrawal,
  updateSellerBankAccount,
} from "@/lib/api/seller";
import type {
  SellerWalletResponse,
  SellerWalletTransaction,
} from "@/types/seller";
import { VIETNAM_BANKS } from "@/lib/constants/vietnam-banks";
import * as XLSX from "xlsx";
import { getCachedWallet, setCachedWallet } from "@/lib/sellerCache";

type TxTabKey = "ALL" | "ORDER_SETTLEMENT" | "WITHDRAWAL";

export default function SellerWalletPage() {
  const cachedWallet = getCachedWallet();
  const [wallet, setWallet] = useState<SellerWalletResponse | null>(() => cachedWallet?.wallet || null);
  const [transactions, setTransactions] = useState<SellerWalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(() => !cachedWallet?.wallet);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [currentTab, setCurrentTab] = useState<TxTabKey>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Bank Link Status & Code Display
  const isBankLinked = Boolean(
    wallet?.bankAccount?.accountNumber && wallet.bankAccount.accountNumber.trim().length > 0
  );

  const bankCodeDisplay = useMemo(() => {
    if (!wallet?.bankAccount) return "BANK";
    if (wallet.bankAccount.bankCode) return wallet.bankAccount.bankCode;
    const name = (wallet.bankAccount.bankName || "").toLowerCase();
    const found = VIETNAM_BANKS.find(
      (b) =>
        b.name.toLowerCase() === name ||
        b.shortName.toLowerCase() === name ||
        name.includes(b.shortName.toLowerCase()) ||
        name.includes(b.code.toLowerCase())
    );
    return found?.code || "BANK";
  }, [wallet?.bankAccount]);

  // Withdrawal modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawNote, setWithdrawNote] = useState<string>("");
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openWithdrawModal = () => {
    setWithdrawError(null);
    setWithdrawAmount("");
    setWithdrawNote("");
    setIsWithdrawModalOpen(true);
  };

  const validateWithdrawAmount = (val: string): string | null => {
    if (!wallet?.bankAccount || !wallet.bankAccount.accountNumber) {
      return "Vui lòng cấu hình tài khoản ngân hàng trước khi tạo yêu cầu rút tiền.";
    }
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      return "Vui lòng nhập số tiền muốn rút.";
    }
    const amountNum = parseInt(clean, 10);
    if (!amountNum || amountNum <= 0) {
      return "Số tiền rút không hợp lệ.";
    }
    if (amountNum < 50000) {
      return "Số tiền rút tối thiểu là 50.000 ₫ mỗi lần.";
    }
    const currentBalance = wallet?.balance || 0;
    if (currentBalance <= 0) {
      return "Số dư khả dụng hiện tại là 0 ₫, không đủ điều kiện rút tiền.";
    }
    if (amountNum > currentBalance) {
      return `Số tiền rút vượt quá số dư khả dụng (${currentBalance.toLocaleString("vi-VN")} ₫).`;
    }
    return null;
  };

  // Bank Account modal
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [bankName, setBankName] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");
  const [branch, setBranch] = useState<string>("");
  const [bankLoading, setBankLoading] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openBankModal = () => {
    if (wallet?.bankAccount) {
      const currentName = wallet.bankAccount.bankName || "";
      const currentCode = (wallet.bankAccount as unknown as { bankCode?: string }).bankCode || "";
      setBankName(currentName || VIETNAM_BANKS[0].name);
      if (currentCode) {
        setBankCode(currentCode);
      } else {
        const found = VIETNAM_BANKS.find(
          (b) => b.name === currentName || b.shortName === currentName
        );
        setBankCode(found?.code || VIETNAM_BANKS[0].code);
      }
      setAccountNumber(wallet.bankAccount.accountNumber || "");
      setAccountHolder(wallet.bankAccount.accountHolder || "");
      setBranch(wallet.bankAccount.branch || "");
    } else {
      setBankName(VIETNAM_BANKS[0].name);
      setBankCode(VIETNAM_BANKS[0].code);
      setAccountNumber("");
      setAccountHolder("");
      setBranch("");
    }
    setIsBankModalOpen(true);
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !bankCode.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin ngân hàng bắt buộc");
      return;
    }
    if (!/^[0-9]{6,30}$/.test(accountNumber.trim())) {
      alert("Số tài khoản chỉ bao gồm từ 6 đến 30 chữ số");
      return;
    }
    if (!/^[A-Z ]+$/.test(accountHolder.trim())) {
      alert("Tên chủ tài khoản phải là chữ in hoa không dấu (Ví dụ: NGUYEN VAN AN)");
      return;
    }

    setBankLoading(true);
    try {
      const updated = await updateSellerBankAccount({
        bankName: bankName.trim(),
        bankCode: bankCode.trim().toUpperCase(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        branch: branch.trim() || undefined,
      });
      showToast("Cập nhật tài khoản ngân hàng thành công!");
      setIsBankModalOpen(false);
      if (wallet) {
        setWallet({
          ...wallet,
          bankAccount: {
            bankName: updated.bankName,
            bankCode: updated.bankCode,
            accountNumber: updated.accountNumber,
            accountHolder: updated.accountHolder,
            branch: updated.branch,
            isVerified: true,
          },
        });
      }
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật ngân hàng thất bại";
      alert(msg);
    } finally {
      setBankLoading(false);
    }
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
          setCachedWallet(walletData, walletData.bankAccount);
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
    const err = validateWithdrawAmount(withdrawAmount);
    if (err) {
      setWithdrawError(err);
      return;
    }

    const amountNum = parseInt(withdrawAmount.replace(/\D/g, ""), 10);
    setWithdrawLoading(true);
    setWithdrawError(null);
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
      setWithdrawError(msg);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleExportStatement = () => {
    if (filteredTxs.length === 0) {
      showToast("Không có giao dịch nào để xuất sao kê.");
      return;
    }

    const exportRows = filteredTxs.map((t, index) => {
      let typeLabel = "Khác";
      if (t.type === "ORDER_SETTLEMENT") typeLabel = "Doanh thu bán hàng";
      else if (t.type === "WITHDRAWAL") typeLabel = "Rút tiền về ngân hàng";
      else if (t.type === "REFUND") typeLabel = "Hoàn tiền";

      let statusLabel = "Hoàn tất";
      if (t.status === "PENDING") statusLabel = "Đang xử lý";
      else if (t.status === "FAILED" || t.status === "REJECTED") statusLabel = "Thất bại";
      else if (t.status === "SUCCESS" || t.status === "COMPLETED") statusLabel = "Thành công";

      const isPositive = t.amount > 0;
      const amountStr = (isPositive ? "+" : "") + t.amount.toLocaleString("vi-VN") + " ₫";
      const balanceStr = (t.balanceAfter ?? 0).toLocaleString("vi-VN") + " ₫";

      return {
        "STT": index + 1,
        "Thời gian giao dịch": formatDateTime(t.createdAt),
        "Loại giao dịch": typeLabel,
        "Mã giao dịch": t.transactionCode || "-",
        "Nội dung diễn giải": t.description || (t.orderCode ? `Quyết toán đơn hàng #${t.orderCode}` : "-"),
        "Biến động (VNĐ)": amountStr,
        "Số dư sau GD (VNĐ)": balanceStr,
        "Trạng thái": statusLabel,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Cấu hình độ rộng các cột tự động theo chuẩn Excel
    worksheet["!cols"] = [
      { wch: 6 },  // STT
      { wch: 22 }, // Thời gian giao dịch
      { wch: 22 }, // Loại giao dịch
      { wch: 24 }, // Mã giao dịch
      { wch: 45 }, // Nội dung diễn giải
      { wch: 20 }, // Biến động (VNĐ)
      { wch: 20 }, // Số dư sau GD (VNĐ)
      { wch: 16 }, // Trạng thái
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sao kê ví doanh thu");

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `sao_ke_vi_doanh_thu_${dateStr}.xlsx`);
    showToast("Đã xuất sao kê ví sang file Excel thành công!");
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
            onClick={openWithdrawModal}
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
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                  {bankCodeDisplay}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {wallet?.bankAccount?.bankName || "Chưa cấu hình ngân hàng"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {wallet?.bankAccount?.branch || "Chi nhánh chính"}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isBankLinked
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isBankLinked ? "verified" : "pending"}
                </span>
                {isBankLinked ? "Đã liên kết" : "Chưa liên kết"}
              </span>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-slate-50/75 border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {wallet?.bankAccount?.accountNumber || "---"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {wallet?.bankAccount?.accountHolder || "---"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-400">Rút tiền miễn phí giao dịch sàn</span>
            <button
              onClick={openBankModal}
              className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit_square</span>
              {wallet?.bankAccount?.accountNumber ? "Thay đổi tài khoản" : "Thiết lập tài khoản"}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-emerald-700 text-[16px]">
                download
              </span>
              Xuất sao kê Excel
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

            <form onSubmit={handleConfirmWithdraw} noValidate className="p-5 space-y-4 text-xs">
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
                    onClick={() => {
                      const bal = wallet?.balance || 0;
                      setWithdrawAmount(bal.toString());
                      if (bal <= 0) {
                        setWithdrawError("Số dư khả dụng hiện tại là 0 ₫, không đủ điều kiện rút tiền.");
                      } else if (bal < 50000) {
                        setWithdrawError(`Số dư khả dụng (${bal.toLocaleString("vi-VN")} ₫) chưa đạt hạn mức tối thiểu 50.000 ₫.`);
                      } else {
                        setWithdrawError(null);
                      }
                    }}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    Rút tất cả ({formatVnd(wallet?.balance)})
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => {
                      setWithdrawAmount(e.target.value);
                      if (withdrawError) setWithdrawError(null);
                    }}
                    onBlur={() => {
                      if (withdrawAmount) {
                        const err = validateWithdrawAmount(withdrawAmount);
                        if (err) setWithdrawError(err);
                      }
                    }}
                    placeholder="Tối thiểu 50.000 ₫"
                    className={`w-full p-2.5 text-sm font-bold rounded-xl transition-all ${
                      withdrawError
                        ? "bg-rose-50/40 border border-rose-400 text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        : "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 font-bold ${
                    withdrawError ? "text-rose-400" : "text-slate-400"
                  }`}>
                    ₫
                  </span>
                </div>

                {withdrawError ? (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-rose-600 animate-in fade-in duration-200">
                    <span className="material-symbols-outlined text-[15px]">error</span>
                    <span>{withdrawError}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hạn mức rút tối thiểu: 50.000 ₫/lần. Miễn phí giao dịch.
                  </p>
                )}
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

      {/* Modal Cập nhật Tài khoản Ngân hàng */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    account_balance
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Tài khoản ngân hàng nhận tiền
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cấu hình tài khoản chính để nhận tiền rút từ ví shop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBankAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên ngân hàng <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={bankName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setBankName(selectedName);
                    const matched = VIETNAM_BANKS.find(
                      (b) => b.name === selectedName || b.shortName === selectedName
                    );
                    if (matched) {
                      setBankCode(matched.code);
                    }
                  }}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium cursor-pointer"
                >
                  <option value="" disabled>
                    -- Chọn ngân hàng trong danh sách --
                  </option>
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã ngân hàng (Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value.toUpperCase())}
                    placeholder="VCB, MB, TCB..."
                    className="w-full p-2.5 text-xs font-mono uppercase font-bold bg-slate-100 border border-slate-200 rounded-xl text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    title="Mã ngân hàng tự động điền theo ngân hàng bạn chọn"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Tự động chọn theo ngân hàng</p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="Chỉ nhập số"
                    className="w-full p-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên chủ tài khoản (In hoa không dấu) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: NGUYEN VAN AN"
                  className="w-full p-2.5 text-xs font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chi nhánh ngân hàng
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Ví dụ: Chi nhánh Thủ Đức, TP. Hồ Chí Minh"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={bankLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {bankLoading ? (
                    <span>Đang lưu...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Lưu thông tin</span>
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
