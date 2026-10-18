"use client";

import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  RealtimeTelemetry,
  LiveSkuInventoryItem,
  LiveLogEvent,
  TrafficDataPoint,
} from "@/types/flash-monitor";
import type { AdminFlashSaleSession } from "@/types/flash-sale";
import {
  getAdminFlashSaleSlots,
  getAdminRealtimeTelemetry,
  getAdminLiveSkus,
  getAdminLiveLogs,
  toggleAdminEmergencyPause,
} from "@/lib/api/admin";
import {
  getMockTelemetry,
  toggleSessionPause,
  getMockLiveSkus,
  getMockLiveLogs,
  clearMockLiveLogs,
  INITIAL_TRAFFIC_DATA,
} from "@/lib/mocks/flash-monitor.mock";
import { getMockFlashSaleSessions } from "@/lib/mocks/flash-sessions.mock";
import {
  TrafficChart,
  AntiOversoldCard,
  LiveEventFeed,
  EmergencyPauseModal,
} from "@/components/admin/flash-sale";

const formatCountdown = (totalSeconds: number) => {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export default function AdminFlashSaleMonitorPage() {
  // 1. Session Picker
  const [sessions, setSessions] = useState<AdminFlashSaleSession[]>(() =>
    getMockFlashSaleSessions()
  );
  const [selectedSessionId, setSelectedSessionId] = useState<number>(3);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);

  // Load sessions from BE API
  useEffect(() => {
    let cancelled = false;
    async function loadSessions() {
      try {
        const slots = await getAdminFlashSaleSlots();
        if (!cancelled && slots.length > 0) {
          setSessions(slots);
          const active = slots.find((s) => s.status === "ACTIVE");
          if (active) setSelectedSessionId(active.id);
          else setSelectedSessionId(slots[0].id);
        }
      } catch {
        // fallback to default sessions
      }
    }
    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  // 2. Telemetry, SKUs & Live Logs
  const [telemetry, setTelemetry] = useState<RealtimeTelemetry>(() =>
    getMockTelemetry()
  );
  const [trafficData] = useState<TrafficDataPoint[]>(() => INITIAL_TRAFFIC_DATA);
  const [skus, setSkus] = useState<LiveSkuInventoryItem[]>(() => getMockLiveSkus());
  const [logs, setLogs] = useState<LiveLogEvent[]>(() => getMockLiveLogs());

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAdminRealtimeTelemetry(selectedSessionId),
      getAdminLiveSkus(selectedSessionId),
      getAdminLiveLogs(selectedSessionId),
    ])
      .then(([tData, skusData, logsData]) => {
        if (!cancelled) {
          setTelemetry(tData);
          setSkus(skusData);
          setLogs(logsData);
        }
      })
      .catch(() => {
        // fallback
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  // 3. Filters
  const [skuSearch, setSkuSearch] = useState("");

  // 4. Countdown & Heartbeat State
  const [secondsLeft, setSecondsLeft] = useState(5077); // ~01:24:37
  const [lastHeartbeatSec, setLastHeartbeatSec] = useState(1);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (telemetry.isPaused) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setLastHeartbeatSec((prev) => (prev < 4 ? prev + 1 : 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [telemetry.isPaused]);

  // Live fluctuating RPS metric effect
  useEffect(() => {
    if (telemetry.isPaused) return;

    const interval = setInterval(() => {
      const jitter = Math.floor(Math.random() * 80) - 40;
      setTelemetry((prev) => ({
        ...prev,
        rps: Math.max(100, 3482 + jitter),
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [telemetry.isPaused]);

  // Periodic simulated live event injection
  useEffect(() => {
    if (telemetry.isPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(
        now.getMilliseconds()
      ).padStart(3, "0")}`;
      const randomNum = Math.floor(1000 + Math.random() * 9000);

      const newEvt: LiveLogEvent = {
        id: `sim-${Date.now()}`,
        timestamp: timeStr,
        type: "LOCK",
        orderCode: `FS-261005-K${randomNum.toString().slice(0, 3)}`,
        message: "Giữ 1 · Áo thun Compact Đen L (Khóa thành công 300s)",
        tag: "Khóa thành công 300s",
        tagColor: "warning",
        userOrInfo: `user_${randomNum}`,
      };

      setLogs((prev) => [newEvt, ...prev].slice(0, 35));
    }, 8000);

    return () => clearInterval(interval);
  }, [telemetry.isPaused]);

  // Filtered SKUs
  const filteredSkus = useMemo(() => {
    if (!skuSearch.trim()) return skus;
    const query = skuSearch.toLowerCase().trim();
    return skus.filter(
      (s) =>
        s.productName.toLowerCase().includes(query) ||
        s.skuCode.toLowerCase().includes(query) ||
        s.storeName.toLowerCase().includes(query)
    );
  }, [skus, skuSearch]);

  // Handlers
  const handleToggleEmergencyPause = async () => {
    if (telemetry.isPaused) {
      // Resume
      try {
        await toggleAdminEmergencyPause(selectedSessionId, "Resume by admin");
      } catch {
        // fallback
      }
      const updated = toggleSessionPause(false);
      setTelemetry(updated);

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.000`;
      const resumeEvt: LiveLogEvent = {
        id: `resume-${Date.now()}`,
        timestamp: timeStr,
        type: "SYNC_DB",
        message: "Phiên Flash Sale đã được TIẾP TỤC bởi Ban Quản Trị",
        tag: "Tiếp tục phiên",
        tagColor: "success",
        userOrInfo: "Super Admin",
      };
      setLogs((prev) => [resumeEvt, ...prev]);
      toast.success("Đã tiếp tục phiên Flash Sale thành công!");
    } else {
      setIsPauseModalOpen(true);
    }
  };

  const handleConfirmEmergencyPause = async (reason: string, note?: string) => {
    try {
      await toggleAdminEmergencyPause(selectedSessionId, reason);
    } catch {
      // fallback
    }
    const updated = toggleSessionPause(true);
    setTelemetry(updated);
    setIsPauseModalOpen(false);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.000`;
    const pauseEvt: LiveLogEvent = {
      id: `pause-${Date.now()}`,
      timestamp: timeStr,
      type: "RATE_LIMIT",
      message: `TẠM DỪNG PHIÊN KHẨN CẤP: ${reason}${
        note ? ` (${note})` : ""
      }`,
      tag: "Tạm dừng khẩn cấp",
      tagColor: "error",
      userOrInfo: "Super Admin",
    };
    setLogs((prev) => [pauseEvt, ...prev]);
    toast.error("Đã kích hoạt tạm dừng phiên khẩn cấp!");
  };

  const handleClearLogs = () => {
    clearMockLiveLogs();
    setLogs([]);
    toast.info("Đã làm mới luồng sự kiện thời gian thực.");
  };

  const handleExportData = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      session: currentSession,
      telemetry,
      skus,
      logs,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flash-sale-monitor-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất snapshot dữ liệu realtime thành công!");
  };

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Top Command Center Bar (Sticky) */}
      <div className="bg-surface-container-lowest px-gutter py-space-md rounded-xl border border-outline-variant/30 sticky top-16 z-30 shadow-[0_1px_4px_rgba(11,28,48,0.03)] flex flex-wrap items-center justify-between gap-space-md">
        {/* Left: Session selector, status & live timer */}
        <div className="flex items-center flex-wrap gap-space-md">
          {/* Session Dropdown Selector */}
          <div className="relative inline-flex items-center">
            <button
              type="button"
              onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
              className="inline-flex items-center bg-surface-container-low rounded-lg px-3 py-1.5 gap-2 cursor-pointer hover:bg-surface-container transition-colors border border-outline-variant/40"
            >
              <span className="text-tertiary-container font-headline-md text-headline-md leading-none">
                ⚡
              </span>
              <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                {currentSession?.name || "Giờ Vàng 12:00"}
              </span>
              <span className="font-body-sm text-body-sm text-secondary">
                ({currentSession?.timeRangeDisplay || "12:00 - 14:00"})
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">
                expand_more
              </span>
            </button>

            {isSessionDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSessionDropdownOpen(false)}
                />
                <div className="absolute left-0 top-12 z-50 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 p-2 flex flex-col gap-1">
                  <span className="px-3 py-1.5 font-label-sm text-[11px] font-semibold text-secondary uppercase tracking-wider">
                    Chọn phiên Flash Sale giám sát
                  </span>
                  {sessions.slice(0, 6).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSessionId(s.id);
                        setIsSessionDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-body-sm transition-colors",
                        s.id === selectedSessionId
                          ? "bg-primary-fixed text-primary font-semibold"
                          : "hover:bg-surface-container-low text-on-surface"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-secondary text-[11px]">
                          {s.timeRangeDisplay} · {s.date}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                          s.status === "ACTIVE"
                            ? "bg-rose-100 text-rose-700"
                            : s.status === "ENDED"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-sky-100 text-sky-700"
                        )}
                      >
                        {s.status === "ACTIVE"
                          ? "Live"
                          : s.status === "ENDED"
                          ? "Kết thúc"
                          : "Sắp tới"}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Live Status Pill */}
          {telemetry.isPaused ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-label-md text-label-md tracking-wider uppercase font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              ĐÃ TẠM DỪNG
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-tertiary font-label-md text-label-md tracking-wider uppercase font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
              </span>
              ĐANG DIỄN RA
            </div>
          )}

          {/* Countdown Block */}
          <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/40">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              timer
            </span>
            <span className="font-body-sm text-body-sm text-secondary hidden sm:inline">
              Thời gian còn lại:
            </span>
            <span
              className="font-data-tabular text-[18px] font-bold text-on-surface tracking-wider bg-surface-container px-2 py-0.5 rounded tabular-nums"
              id="countdown-timer"
            >
              {formatCountdown(secondsLeft)}
            </span>
          </div>

          {/* WebSocket Heartbeat */}
          <div className="flex items-center gap-2 bg-surface px-2.5 py-1 rounded-lg">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                telemetry.isPaused
                  ? "bg-amber-500"
                  : "bg-[#16A34A] animate-pulse"
              )}
            />
            <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1">
              Kết nối trực tiếp ·{" "}
              <span className="text-on-surface font-medium">
                Cập nhật {lastHeartbeatSec} giây trước
              </span>
            </span>
          </div>
        </div>

        {/* Right: Global Actions */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={handleToggleEmergencyPause}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-headline-md text-body-sm font-semibold transition-colors border",
              telemetry.isPaused
                ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                : "bg-error-container/40 text-error hover:bg-error-container border-error/30"
            )}
          >
            <span className="material-symbols-outlined text-[18px]">
              {telemetry.isPaused ? "play_circle" : "pause_circle"}
            </span>
            <span>
              {telemetry.isPaused
                ? "Tiếp tục phiên"
                : "Tạm dừng phiên khẩn cấp"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-headline-md text-body-sm font-semibold shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              file_download
            </span>
            <span>Xuất dữ liệu realtime</span>
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards: 5 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {/* Card 1: RPS */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold text-[11px]">
              Request / Giây (RPS)
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed/60 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">
                reorder
              </span>
            </div>
          </div>
          <div className="mt-space-sm">
            <div className="flex items-baseline gap-2">
              <span
                className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight tabular-nums"
                id="metric-rps"
              >
                {telemetry.rps.toLocaleString("vi-VN")}
              </span>
              <span className="font-label-md text-label-md text-secondary">
                rps
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[#16A34A] font-label-md text-label-md font-semibold">
              <span className="material-symbols-outlined text-[14px]">
                arrow_upward
              </span>
              <span>14% peak tải mở cổng</span>
            </div>
          </div>
        </div>

        {/* Card 2: Locks */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold text-[11px]">
              Giữ Chỗ Đang Chờ (Locks)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined text-[18px]">
                lock_clock
              </span>
            </div>
          </div>
          <div className="mt-space-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight tabular-nums">
                {telemetry.activeLocks}
              </span>
              <span className="font-label-md text-label-md text-secondary">
                đơn
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-secondary block mt-1">
              Chờ thanh toán giỏ (300s)
            </span>
          </div>
        </div>

        {/* Card 3: Completed Orders */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold text-[11px]">
              Thanh Toán Thành Công
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] flex items-center justify-center text-[#16A34A]">
              <span className="material-symbols-outlined text-[18px]">
                verified
              </span>
            </div>
          </div>
          <div className="mt-space-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg font-bold text-[#16A34A] tracking-tight tabular-nums">
                {telemetry.completedOrders.toLocaleString("vi-VN")}
              </span>
              <span className="font-label-md text-label-md text-secondary">
                đơn
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface font-medium block mt-1 tabular-nums">
              Doanh thu ~ 385,4 triệu ₫
            </span>
          </div>
        </div>

        {/* Card 4: Expired Releases */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold text-[11px]">
              Hết Hạn &amp; Hoàn Kho
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">
                restart_alt
              </span>
            </div>
          </div>
          <div className="mt-space-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight tabular-nums">
                {telemetry.expiredReleases}
              </span>
              <span className="font-label-md text-label-md text-secondary">
                đơn
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-secondary block mt-1">
              Mở khóa lại kho tự động
            </span>
          </div>
        </div>

        {/* Card 5: P99 Latency */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold text-[11px]">
              Độ Trễ Hệ Thống P99
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#16A34A]">
              <span className="material-symbols-outlined text-[18px]">
                speed
              </span>
            </div>
          </div>
          <div className="mt-space-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg font-bold text-[#16A34A] tracking-tight tabular-nums">
                {telemetry.p99LatencyMs}
              </span>
              <span className="font-label-md text-label-md font-semibold text-[#16A34A]">
                ms
              </span>
            </div>
            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A] font-label-sm text-label-sm font-semibold">
              <span>Mục tiêu &lt; 500ms · Rất tốt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Chart & Anti-Oversold Engine (60% / 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* 60% Column: Traffic vs Orders Chart */}
        <div className="lg:col-span-7">
          <TrafficChart data={trafficData} />
        </div>

        {/* 40% Column: Anti-Oversold Engine */}
        <div className="lg:col-span-5">
          <AntiOversoldCard
            redisStock={2500}
            postgresStock={2500}
            completedOrders={telemetry.completedOrders}
            holdingLocks={telemetry.activeLocks}
            syncIntervalMs={1000}
          />
        </div>
      </div>

      {/* Section 3: Live SKU Inventory Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        {/* Table Header */}
        <div className="px-space-lg py-space-md border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              inventory_2
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Tồn kho theo SKU (Cập nhật thời gian thực)
            </h2>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold">
              {skus.length} SKU tham gia
            </span>
          </div>

          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                search
              </span>
              <input
                type="text"
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                placeholder="Lọc mã SKU, tên shop..."
                className="h-9 pl-8 pr-3 rounded-lg border border-outline-variant/60 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary transition-all bg-surface-bright"
              />
            </div>
          </div>
        </div>

        {/* Realtime Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="h-11 bg-surface-container-low border-b border-outline-variant/30 text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                <th className="px-space-lg py-2">Sản phẩm &amp; Phân loại SKU</th>
                <th className="px-space-md py-2">Gian hàng</th>
                <th className="px-space-md py-2 text-right">Mở bán</th>
                <th className="px-space-md py-2 text-right">Còn lại</th>
                <th className="px-space-md py-2 text-right">Đang giữ chỗ</th>
                <th className="px-space-md py-2 text-right">Đã bán</th>
                <th className="px-space-lg py-2 min-w-[160px]">Tiến trình bán</th>
                <th className="px-space-lg py-2 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-md text-body-md text-on-surface">
              {filteredSkus.map((sku) => {
                const soldPercent = Math.min(
                  100,
                  Math.round((sku.soldStock / sku.allocatedStock) * 100)
                );
                return (
                  <tr
                    key={sku.id}
                    className="h-14 hover:bg-surface-container-low/60 transition-colors"
                  >
                    {/* SKU Name & Icon */}
                    <td className="px-space-lg py-2">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded bg-surface-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            {sku.icon}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-headline-md text-body-md font-semibold text-on-surface truncate">
                            {sku.productName}
                          </div>
                          <div className="font-label-sm text-label-sm text-secondary font-mono">
                            {sku.skuCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Store */}
                    <td className="px-space-md py-2 text-secondary">
                      {sku.storeName}
                    </td>

                    {/* Allocated */}
                    <td className="px-space-md py-2 text-right font-data-tabular tabular-nums">
                      {sku.allocatedStock}
                    </td>

                    {/* Available / Remaining */}
                    <td className="px-space-md py-2 text-right">
                      {sku.id === 1 ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-data-tabular font-bold transition-all duration-300 tabular-nums">
                          {sku.availableStock}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "font-data-tabular font-bold tabular-nums",
                            sku.status === "ALMOST_OUT" && "text-tertiary",
                            sku.status === "SOLD_OUT" && "text-secondary"
                          )}
                        >
                          {sku.availableStock}
                        </span>
                      )}
                    </td>

                    {/* Holding */}
                    <td className="px-space-md py-2 text-right font-data-tabular text-amber-700 font-medium tabular-nums">
                      {sku.holdingStock}
                    </td>

                    {/* Sold */}
                    <td className="px-space-md py-2 text-right font-data-tabular text-on-surface font-semibold tabular-nums">
                      {sku.soldStock}
                    </td>

                    {/* Progress */}
                    <td className="px-space-lg py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              sku.status === "SOLD_OUT"
                                ? "bg-secondary"
                                : "bg-tertiary-container"
                            )}
                            style={{ width: `${soldPercent}%` }}
                          />
                        </div>
                        <span className="font-label-sm text-label-sm text-secondary whitespace-nowrap tabular-nums">
                          {soldPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-space-lg py-2 text-center">
                      {sku.status === "SELLING" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-md font-label-md bg-[#DCFCE7] text-[#16A34A] font-medium">
                          Đang bán
                        </span>
                      )}
                      {sku.status === "ALMOST_OUT" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-md font-label-md bg-amber-100 text-amber-800 font-medium">
                          Sắp cháy hàng
                        </span>
                      )}
                      {sku.status === "SOLD_OUT" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-md font-label-md bg-surface-container text-secondary font-medium">
                          Hết hàng
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Live Event Stream (Terminal Feed) */}
      <LiveEventFeed
        events={logs}
        onClear={handleClearLogs}
        isPaused={telemetry.isPaused}
      />

      {/* Emergency Pause Confirmation Modal */}
      <EmergencyPauseModal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        onConfirm={handleConfirmEmergencyPause}
        sessionName={currentSession?.name}
      />
    </div>
  );
}
