"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  triggerSearchReindex,
  getSearchIndexStatus,
  triggerImageSearchReindex,
  getImageSearchStatus,
} from "@/lib/api/admin";
import type {
  SearchReindexResponse,
  ImageReindexResponse,
  ImageSearchStatusResponse,
} from "@/types/admin";

interface ExecutionLog {
  id: string;
  time: string;
  type: "FTS" | "IMAGE";
  message: string;
  success: boolean;
  details?: string;
}

export default function AdminReindexSearchPage() {
  // Trạng thái nạp dữ liệu ban đầu
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isFtsReindexing, setIsFtsReindexing] = useState(false);
  const [isImageReindexing, setIsImageReindexing] = useState(false);

  // Dữ liệu trạng thái chỉ mục
  const [ftsStatus, setFtsStatus] = useState<SearchReindexResponse | null>(null);
  const [imageStatus, setImageStatus] = useState<ImageSearchStatusResponse | null>(null);

  // Kết quả lần chạy gần nhất
  const [lastFtsResult, setLastFtsResult] = useState<SearchReindexResponse | null>(null);
  const [lastImageResult, setLastImageResult] = useState<ImageReindexResponse | null>(null);

  // Nhật ký thực thi phiên làm việc
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  // Modal xác nhận trước khi chạy reindex
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "fts" | "image" | null;
  }>({
    isOpen: false,
    type: null,
  });

  const addLog = useCallback(
    (type: "FTS" | "IMAGE", message: string, success: boolean, details?: string) => {
      const newLog: ExecutionLog = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        time: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
        type,
        message,
        success,
        details,
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 19)]); // Giữ tối đa 20 bản ghi
    },
    []
  );

  // Nạp trạng thái 2 hệ thống
  const fetchStatuses = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const [ftsRes, imgRes] = await Promise.allSettled([
        getSearchIndexStatus(),
        getImageSearchStatus(),
      ]);

      if (ftsRes.status === "fulfilled") {
        setFtsStatus(ftsRes.value);
      } else {
        console.warn("[AdminReindexSearch] Lỗi lấy status FTS:", ftsRes.reason);
      }

      if (imgRes.status === "fulfilled") {
        setImageStatus(imgRes.value);
      } else {
        console.warn("[AdminReindexSearch] Lỗi lấy status Image Search:", imgRes.reason);
      }
    } catch (err) {
      console.error("[AdminReindexSearch] Lỗi khi làm mới trạng thái:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Xử lý Reindex Full-Text Search (OpenSearch)
  const handleExecuteFts = async () => {
    setConfirmModal({ isOpen: false, type: null });
    setIsFtsReindexing(true);
    const toastId = toast.loading("Đang quét sản phẩm và lập chỉ mục OpenSearch...");

    try {
      const res = await triggerSearchReindex();
      setLastFtsResult(res);
      setFtsStatus({
        indexedCount: 0,
        indexCount: res.indexCount,
      });

      toast.success(
        `Reindex FTS thành công! Đã ghi ${res.indexedCount.toLocaleString()} tài liệu (Tổng: ${res.indexCount.toLocaleString()}).`,
        { id: toastId }
      );
      addLog(
        "FTS",
        `Đã reindex thành công ${res.indexedCount} sản phẩm vào OpenSearch.`,
        true,
        `Tổng tài liệu trong index: ${res.indexCount}`
      );
    } catch (err: any) {
      const msg = err?.message || "Lập chỉ mục tìm kiếm toàn văn thất bại";
      toast.error(`Reindex FTS thất bại: ${msg}`, { id: toastId });
      addLog("FTS", `Reindex thất bại: ${msg}`, false);
    } finally {
      setIsFtsReindexing(false);
    }
  };

  // Xử lý Reindex Vector Ảnh (pgvector)
  const handleExecuteImageReindex = async () => {
    setConfirmModal({ isOpen: false, type: null });
    setIsImageReindexing(true);
    const toastId = toast.loading("Đang trích xuất vector embedding và đồng bộ pgvector...");

    try {
      const res = await triggerImageSearchReindex();
      setLastImageResult(res);
      // Cập nhật lại số lượng vector
      if (imageStatus) {
        setImageStatus({
          ...imageStatus,
          totalVectorsInDb: imageStatus.totalVectorsInDb + res.successCount,
        });
      }

      toast.success(
        `Đồng bộ vector ảnh thành công! Đã xử lý ${res.successCount.toLocaleString()}/${res.totalScanned.toLocaleString()} ảnh (${res.durationMs}ms).`,
        { id: toastId }
      );
      addLog(
        "IMAGE",
        `Hoàn thành đồng bộ vector ảnh: ${res.successCount}/${res.totalScanned} thành công, ${res.failedCount} lỗi.`,
        res.failedCount === 0,
        `Thời gian: ${res.durationMs}ms`
      );
      // Tải lại status để có số liệu chính xác từ database
      fetchStatuses();
    } catch (err: any) {
      const msg = err?.message || "Đồng bộ vector ảnh sản phẩm thất bại";
      toast.error(`Đồng bộ vector thất bại: ${msg}`, { id: toastId });
      addLog("IMAGE", `Đồng bộ vector thất bại: ${msg}`, false);
    } finally {
      setIsImageReindexing(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-outline-variant mb-1">
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
            <span>/</span>
            <span>Hệ thống</span>
            <span>/</span>
            <span className="text-primary font-bold">Reindex Search</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Quản trị Chỉ mục Tìm kiếm (Reindex Search)
          </h1>
          <p className="text-sm text-outline-variant mt-0.5">
            Khởi chạy đồng bộ lại chỉ mục toàn văn (OpenSearch) và vector hình ảnh (pgvector) cho toàn bộ sản phẩm trên hệ thống.
          </p>
        </div>

        {/* Nút Làm mới Trạng thái */}
        <button
          type="button"
          onClick={fetchStatuses}
          disabled={isLoadingStatus || isFtsReindexing || isImageReindexing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface text-on-surface hover:bg-surface-container-high transition-colors text-sm font-semibold shadow-xs disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              isLoadingStatus ? "animate-spin" : ""
            }`}
          >
            refresh
          </span>
          <span>{isLoadingStatus ? "Đang tải..." : "Làm mới trạng thái"}</span>
        </button>
      </div>

      {/* 2 Card Điều khiển Reindex Chính */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* ========================================================= */}
        {/* CARD 1: FULL-TEXT SEARCH (OpenSearch) */}
        {/* ========================================================= */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface shadow-xs p-space-lg flex flex-col justify-between">
          <div className="space-y-space-md">
            {/* Header Card */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">manage_search</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">Tìm kiếm Toàn văn (FTS)</h2>
                  <p className="text-xs text-outline-variant">OpenSearch / Elasticsearch Cluster</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary uppercase tracking-wide">
                Full-Text
              </span>
            </div>

            {/* Mô tả nghiệp vụ */}
            <p className="text-sm text-outline-variant leading-relaxed">
              Quét toàn bộ sản phẩm có trạng thái <strong className="text-on-surface">ACTIVE</strong> (thuộc gian hàng đã được duyệt) và nạp lại vào chỉ mục OpenSearch. Thao tác mang tính idempotent, an toàn khi chạy lại nhiều lần.
            </p>

            {/* Trạng thái hiện tại */}
            <div className="rounded-xl bg-surface-container-low p-space-md border border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline-variant">Tổng tài liệu trong Index:</span>
                <span className="font-bold font-mono text-sm text-on-surface">
                  {ftsStatus?.indexCount !== undefined
                    ? `${ftsStatus.indexCount.toLocaleString()} docs`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline-variant">Trạng thái OpenSearch:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sẵn sàng hoạt động
                </span>
              </div>
            </div>

            {/* Kết quả lần chạy gần nhất (nếu có) */}
            {lastFtsResult && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-space-sm text-xs text-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">
                    check_circle
                  </span>
                  <span>Đã đồng bộ thành công gần nhất:</span>
                </div>
                <div className="pl-5 space-y-0.5 text-emerald-700">
                  <div>• Đã ghi: <strong>{lastFtsResult.indexedCount.toLocaleString()}</strong> sản phẩm</div>
                  <div>• Tổng trong index: <strong>{lastFtsResult.indexCount.toLocaleString()}</strong> documents</div>
                </div>
              </div>
            )}
          </div>

          {/* Nút Thực thi */}
          <div className="pt-space-md border-t border-outline-variant/20 mt-space-md">
            <button
              type="button"
              onClick={() => setConfirmModal({ isOpen: true, type: "fts" })}
              disabled={isFtsReindexing || isImageReindexing}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFtsReindexing ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  <span>Đang xử lý Reindex OpenSearch...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">sync</span>
                  <span>Khởi chạy Reindex Full-Text</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: IMAGE SEARCH VECTOR (pgvector) */}
        {/* ========================================================= */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface shadow-xs p-space-lg flex flex-col justify-between">
          <div className="space-y-space-md">
            {/* Header Card */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">image_search</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">Tìm kiếm Bằng Hình ảnh</h2>
                  <p className="text-xs text-outline-variant">AI Embedding + pgvector (PostgreSQL)</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 uppercase tracking-wide">
                AI Vector
              </span>
            </div>

            {/* Mô tả nghiệp vụ */}
            <p className="text-sm text-outline-variant leading-relaxed">
              Quét toàn bộ ảnh sản phẩm <strong className="text-on-surface">ACTIVE</strong>, gửi qua dịch vụ AI để trích xuất đặc trưng vector embedding đa chiều và lưu trữ vào PostgreSQL pgvector.
            </p>

            {/* Trạng thái hiện tại */}
            <div className="rounded-xl bg-surface-container-low p-space-md border border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline-variant">Tổng vector ảnh trong Database:</span>
                <span className="font-bold font-mono text-sm text-on-surface">
                  {imageStatus?.totalVectorsInDb !== undefined
                    ? `${imageStatus.totalVectorsInDb.toLocaleString()} vectors`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline-variant">Kết nối AI Embedding Service:</span>
                {imageStatus?.aiServiceHealthy ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đang hoạt động (Online)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Không khả dụng (Offline)
                  </span>
                )}
              </div>
            </div>

            {/* Kết quả lần chạy gần nhất (nếu có) */}
            {lastImageResult && (
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-space-sm text-xs text-purple-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-purple-600">
                    check_circle
                  </span>
                  <span>Kết quả đồng bộ vector gần nhất:</span>
                </div>
                <div className="pl-5 grid grid-cols-2 gap-1 text-purple-800">
                  <div>• Tổng ảnh: <strong>{lastImageResult.totalScanned}</strong></div>
                  <div>• Thành công: <strong className="text-emerald-700">{lastImageResult.successCount}</strong></div>
                  <div>• Thất bại: <strong className={lastImageResult.failedCount > 0 ? "text-rose-600" : ""}>{lastImageResult.failedCount}</strong></div>
                  <div>• Thời gian: <strong>{(lastImageResult.durationMs / 1000).toFixed(2)}s</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Nút Thực thi */}
          <div className="pt-space-md border-t border-outline-variant/20 mt-space-md">
            <button
              type="button"
              onClick={() => setConfirmModal({ isOpen: true, type: "image" })}
              disabled={isFtsReindexing || isImageReindexing}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImageReindexing ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  <span>Đang trích xuất Vector & Lưu DB...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                  <span>Khởi chạy Reindex Vector Ảnh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* KHU VỰC NHẬT KÝ THỰC THI (EXECUTION LOGS) */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface shadow-xs p-space-lg space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">
              receipt_long
            </span>
            <h2 className="text-base font-bold text-on-surface">Nhật ký Thực thi Phiên làm việc</h2>
          </div>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={() => setLogs([])}
              className="text-xs text-outline-variant hover:text-rose-500 font-semibold transition-colors"
            >
              Xóa nhật ký
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-sm text-outline-variant/70 border border-dashed border-outline-variant/30 rounded-xl">
            Chưa có thao tác reindex nào trong phiên làm việc hiện tại.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/15 border border-outline-variant/20 rounded-xl overflow-hidden bg-surface-container-lowest font-mono text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 flex items-start justify-between gap-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-outline-variant font-mono">{log.time}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.type === "FTS"
                        ? "bg-primary/10 text-primary"
                        : "bg-purple-500/10 text-purple-600"
                    }`}
                  >
                    {log.type}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-on-surface font-sans font-medium">{log.message}</span>
                    {log.details && (
                      <span className="text-outline-variant text-[11px] mt-0.5">
                        {log.details}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {log.success ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      Thành công
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                      Thất bại
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL XÁC NHẬN THỰC THI (CONFIRMATION DIALOG) */}
      {/* ========================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-6 flex flex-col gap-4">
            {/* Header Icon + Tiêu đề */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.type === "fts"
                    ? "bg-primary/10 text-primary"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {confirmModal.type === "fts" ? "manage_search" : "image_search"}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmModal.type === "fts"
                    ? "Xác nhận Reindex Full-Text Search"
                    : "Xác nhận Reindex Vector Hình ảnh"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hành động này sẽ gửi yêu cầu tới cụm máy chủ và xử lý hàng loạt dữ liệu sản phẩm.
                </p>
              </div>
            </div>

            {/* Cảnh báo nội dung */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
              <strong>Lưu ý:</strong>{" "}
              {confirmModal.type === "fts"
                ? "Hệ thống sẽ đồng bộ toàn bộ sản phẩm ACTIVE vào OpenSearch index. Tác vụ này chạy nền và có thể mất từ vài giây đến một phút."
                : "Hệ thống sẽ quét toàn bộ ảnh sản phẩm ACTIVE và gửi tới AI Embedding Gateway. Quá trình này tiêu tốn năng lực tính toán và thời gian tùy thuộc số lượng ảnh."}
            </div>

            {/* Các nút hành động */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={
                  confirmModal.type === "fts" ? handleExecuteFts : handleExecuteImageReindex
                }
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors ${
                  confirmModal.type === "fts"
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Xác nhận khởi chạy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

