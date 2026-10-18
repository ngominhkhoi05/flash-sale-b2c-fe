"use client";

import React, { useState, useEffect } from "react";
import {
  getAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "@/lib/api/admin";
import type { AdminWithdrawalResponse } from "@/types/admin";

type WithdrawalStatusTab = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export function ReconciliationWalletTab() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<WithdrawalStatusTab>("PENDING");
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Approve Modal
  const [approveTarget, setApproveTarget] = useState<AdminWithdrawalResponse | null>(null);
  const [approveNote, setApproveNote] = useState<string>("");
  const [approveLoading, setApproveLoading] = useState<boolean>(false);

  // Reject Modal
  const [rejectTarget, setRejectTarget] = useState<AdminWithdrawalResponse | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const triggerReload = () => {
    setLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    getAdminWithdrawals({
      status: activeStatus,
      page,
      size: pageSize,
    })
      .then((res) => {
        if (!isMounted) return;
        const items = res.items || res.content || [];
        setWithdrawals(items);
        setTotalElements(res.totalElements || items.length);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Không thể tải danh sách rút tiền";
        setError(msg);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeStatus, page, pageSize, reloadKey]);

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setApproveLoading(true);
    try {
      await approveWithdrawal(approveTarget.id, {
        adminNote: approveNote.trim() || undefined,
      });
      showToast(`Đã duyệt chi thành công cho lệnh #${approveTarget.requestCode}!`);
      setApproveTarget(null);
      setApproveNote("");
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Phê duyệt thất bại";
      alert(msg);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      alert("Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự)");
      return;
    }
    setRejectLoading(true);
    try {
      await rejectWithdrawal(rejectTarget.id, {
        reason: rejectReason.trim(),
      });
      showToast(`Đã từ chối lệnh #${rejectTarget.requestCode} và hoàn tiền về ví shop.`);
      setRejectTarget(null);
      setRejectReason("");
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Từ chối thất bại";
      alert(msg);
    } finally {
      setRejectLoading(false);
    }
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
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-xl animate-in fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Filter Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Duyệt Lệnh Rút tiền Ví Người bán
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phê duyệt lệnh chuyển khoản ngân hàng và kiểm soát số dư đóng băng của các gian hàng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            {[
              { key: "PENDING", label: "Chờ duyệt" },
              { key: "APPROVED", label: "Đã chi" },
              { key: "REJECTED", label: "Đã từ chối" },
              { key: "ALL", label: "Tất cả" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveStatus(tab.key as WithdrawalStatusTab);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeStatus === tab.key
                    ? "bg-white text-emerald-700 font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={triggerReload}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Làm mới"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <span className="material-symbols-outlined text-3xl animate-spin text-emerald-600 block mb-2">
              progress_activity
            </span>
            Đang tải danh sách yêu cầu rút tiền...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">
            <span className="material-symbols-outlined text-3xl block mb-2">error</span>
            {error}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">
              inbox
            </span>
            Không có yêu cầu rút tiền nào trong danh mục này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Mã lệnh</th>
                  <th className="py-3.5 px-4">Gian hàng</th>
                  <th className="py-3.5 px-4">Số tiền rút</th>
                  <th className="py-3.5 px-4">Tài khoản nhận tiền</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Ghi chú</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.requestCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {item.storeName || `Shop #${item.storeId}`}
                      </div>
                      <div className="text-[11px] text-slate-400">ID: {item.storeId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatVnd(item.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {item.bankCode} - {item.bankName}
                      </div>
                      <div className="font-mono text-emerald-700 font-bold">
                        {item.accountNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 uppercase">
                        {item.accountHolder}
                      </div>
                      {item.branch && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {item.branch}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Chờ duyệt chi
                        </span>
                      )}
                      {item.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="material-symbols-outlined text-[13px]">check</span>
                          Đã chuyển tiền
                        </span>
                      )}
                      {item.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="material-symbols-outlined text-[13px]">close</span>
                          Đã từ chối
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <div>Tạo: {formatDateTime(item.createdAt)}</div>
                      {item.approvedAt && (
                        <div className="text-emerald-700 font-medium">
                          Duyệt: {formatDateTime(item.approvedAt)}
                        </div>
                      )}
                      {item.rejectedAt && (
                        <div className="text-rose-700 font-medium">
                          Từ chối: {formatDateTime(item.rejectedAt)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px]">
                      {item.sellerNote && (
                        <div className="text-[11px] text-slate-600 italic truncate" title={item.sellerNote}>
                          Shop: &quot;{item.sellerNote}&quot;
                        </div>
                      )}
                      {item.adminNote && (
                        <div className="text-[11px] text-slate-800 font-medium truncate" title={item.adminNote}>
                          Admin: {item.adminNote}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setApproveTarget(item);
                              setApproveNote("");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Duyệt chi
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectTarget(item);
                              setRejectReason("");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">block</span>
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Đã xử lý
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination summary */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Tổng số: <strong className="text-slate-800">{totalElements}</strong> yêu cầu rút tiền
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Trang trước
            </button>
            <span className="px-2 font-medium">Trang {page + 1}</span>
            <button
              type="button"
              disabled={(page + 1) * pageSize >= totalElements}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal Duyệt Chi */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Xác nhận duyệt chi chuyển khoản
                </h3>
                <p className="text-xs text-slate-500">
                  Lệnh rút #{approveTarget.requestCode}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Gian hàng:</span>
                <span className="font-bold text-slate-800">{approveTarget.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền duyệt:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {formatVnd(approveTarget.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-slate-800">
                  {approveTarget.bankCode} - {approveTarget.bankName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-mono font-bold text-slate-900">
                  {approveTarget.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {approveTarget.accountHolder}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú phê duyệt / Mã lệnh UNC chuyển khoản (tùy chọn)
              </label>
              <input
                type="text"
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Ví dụ: Đã chuyển khoản qua lệnh UNC-9921"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={approveLoading}
                onClick={handleConfirmApprove}
                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {approveLoading ? "Đang xử lý..." : "Xác nhận đã chuyển tiền"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ Chối */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Từ chối lệnh rút tiền
                </h3>
                <p className="text-xs text-slate-500">
                  Lệnh #{rejectTarget.requestCode} ({formatVnd(rejectTarget.amount)})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Hệ thống sẽ hoàn trả toàn bộ số tiền{" "}
              <strong className="text-slate-900">{formatVnd(rejectTarget.amount)}</strong> từ số dư đóng băng về số dư khả dụng của shop.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do từ chối <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Sai số tài khoản hoặc tên chủ tài khoản thụ hưởng không khớp"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={rejectLoading}
                onClick={handleConfirmReject}
                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {rejectLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
