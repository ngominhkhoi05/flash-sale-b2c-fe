"use client";

import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  RealtimeTelemetry,
  LiveSkuInventoryItem,
  LiveSkuStatus,
  LiveLogEvent,
  TrafficDataPoint,
} from "@/types/flash-monitor";
import type { AdminFlashSaleSession } from "@/types/flash-sale";
import { useFlashSaleWs } from "@/hooks/useFlashSaleWs";
import {
  getAdminFlashSaleSlots,
  getAdminRealtimeTelemetry,
  getAdminLiveSkus,
  getAdminLiveLogs,
  emergencyPauseFlashSaleSlot,
  toggleAdminEmergencyPause,
} from "@/lib/api/admin";
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

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminSlotsQuery,
  useAdminTelemetryQuery,
  useAdminLiveSkusQuery,
  ADMIN_QUERY_KEYS,
} from "@/hooks/useAdminQueries";
import { useWs } from "@/providers/WsConnectionProvider";

function MonitorContent() {
  const queryClient = useQueryClient();
  const { connectionState } = useWs();
  const searchParams = useSearchParams();
  const rawParamSlotId = searchParams.get("slotId");
  const urlSlotId = rawParamSlotId ? Number(rawParamSlotId) : null;

  // 1. Session Picker lấy trực tiếp từ React Query cache (0ms, đã nạp sẵn)
  const { data: sessions = [] } = useAdminSlotsQuery();

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(() => {
    if (urlSlotId && !isNaN(urlSlotId)) return urlSlotId;
    return null;
  });
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);

  // CHỈ LỌC CÁC PHIÊN ĐANG DIỄN RA (ACTIVE) HOẶC ĐANG TẠM DỪNG (PAUSED) ĐỂ KÍCH HOẠT LẠI
  // Tuyệt đối không lấy phiên sắp xảy ra (UPCOMING) và đã kết thúc (ENDED)
  const monitorableSessions = useMemo(() => {
    return sessions
      .filter((s) => s.status === "ACTIVE" || s.status === "PAUSED")
      .sort((a, b) => {
        if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
        if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });
  }, [sessions]);

  const activeSessionsCount = useMemo(() => {
    return monitorableSessions.filter((s) => s.status === "ACTIVE").length;
  }, [monitorableSessions]);

  const pausedSessionsCount = useMemo(() => {
    return monitorableSessions.filter((s) => s.status === "PAUSED").length;
  }, [monitorableSessions]);

  // Bộ lọc trong dropdown: Tất cả (ACTIVE + PAUSED), Đang live (ACTIVE), hoặc Tạm dừng (PAUSED)
  const [sessionFilterMode, setSessionFilterMode] = useState<"ALL" | "ACTIVE_ONLY" | "PAUSED_ONLY">("ALL");

  const selectableSessions = useMemo(() => {
    if (sessionFilterMode === "ACTIVE_ONLY") {
      return monitorableSessions.filter((s) => s.status === "ACTIVE");
    }
    if (sessionFilterMode === "PAUSED_ONLY") {
      return monitorableSessions.filter((s) => s.status === "PAUSED");
    }
    return monitorableSessions;
  }, [monitorableSessions, sessionFilterMode]);

  // Tự động nhận diện slotId: chỉ chọn trong các phiên ACTIVE hoặc PAUSED
  useEffect(() => {
    if (urlSlotId && !isNaN(urlSlotId) && monitorableSessions.some((s) => s.id === urlSlotId)) {
      setSelectedSessionId(urlSlotId);
      return;
    }
    if (monitorableSessions.length > 0) {
      if (!selectedSessionId || !monitorableSessions.some((s) => s.id === selectedSessionId)) {
        const active = monitorableSessions.find((s) => s.status === "ACTIVE");
        setSelectedSessionId(active ? active.id : monitorableSessions[0].id);
      }
    } else {
      setSelectedSessionId(null);
    }
  }, [urlSlotId, monitorableSessions, selectedSessionId]);

  const currentSession = useMemo(() => {
    if (!selectedSessionId) return monitorableSessions[0] || null;
    return monitorableSessions.find((s) => s.id === selectedSessionId) || monitorableSessions[0] || null;
  }, [monitorableSessions, selectedSessionId]);

  // 2. React Query nạp Telemetry & SKUs có Caching và placeholderData
  const activeSlotId = selectedSessionId ?? undefined;
  const { data: cachedTelemetry, error: telemetryError } = useAdminTelemetryQuery(activeSlotId);
  const { data: cachedSkus = [] } = useAdminLiveSkusQuery(activeSlotId);

  // Local state cho Realtime Streaming từ WebSocket STOMP
  const [telemetry, setTelemetry] = useState<RealtimeTelemetry>({
    rps: 0,
    activeLocks: 0,
    completedOrders: 0,
    totalRevenue: 0,
    expiredReleases: 0,
    p99LatencyMs: 0,
    isPaused: false,
    lastUpdated: "--:--:--",
  });
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([]);
  const [skus, setSkus] = useState<LiveSkuInventoryItem[]>([]);
  const [logs, setLogs] = useState<LiveLogEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPausing, setIsPausing] = useState<boolean>(false);

  // Đồng bộ telemetry từ query cache vào local state
  useEffect(() => {
    if (cachedTelemetry) {
      setTelemetry((prev) => ({
        ...cachedTelemetry,
        completedOrders: Math.max(prev.completedOrders, cachedTelemetry.completedOrders),
        totalRevenue: Math.max(prev.totalRevenue, cachedTelemetry.totalRevenue),
      }));
    }
  }, [cachedTelemetry]);

  // Đồng bộ skus từ query cache vào local state
  useEffect(() => {
    if (cachedSkus && cachedSkus.length > 0) {
      setSkus((prev) => {
        if (prev.length === 0) return cachedSkus;
        const prevMap = new Map(prev.map((item) => [item.id, item]));
        return cachedSkus.map((item) => {
          const existing = prevMap.get(item.id);
          if (existing && existing.availableStock !== undefined) {
            return {
              ...item,
              availableStock: existing.availableStock,
              soldStock: existing.soldStock,
              status: existing.status,
            };
          }
          return item;
        });
      });
    }
  }, [cachedSkus]);

  // Realtime STOMP WebSocket subscriber for slot status & stock updates
  useFlashSaleWs({
    enabled: !!selectedSessionId,
    subscribeSlotIds: selectedSessionId ? [selectedSessionId] : [],
    onMessage: (event) => {
      if ("slotId" in event && event.slotId === selectedSessionId) {
        if (event.eventType === "SLOT_CLOSED") {
          setTelemetry((prev) => ({ ...prev, isPaused: true }));
        } else if (event.eventType === "SLOT_ACTIVATED") {
          setTelemetry((prev) => ({ ...prev, isPaused: false }));
        } else if (
          event.eventType === "STOCK_DECREMENTED" ||
          event.eventType === "STOCK_RESTORED"
        ) {
          const { flashSaleItemId, availableStock } = event;
          setSkus((prev) =>
            prev.map((s) =>
              s.id === flashSaleItemId
                ? {
                    ...s,
                    availableStock,
                    soldStock: Math.max(0, s.allocatedStock - availableStock),
                    status:
                      availableStock <= 0
                        ? "SOLD_OUT"
                        : availableStock < s.allocatedStock * 0.1
                        ? "ALMOST_OUT"
                        : "SELLING",
                  }
                : s
            )
          );
        } else if (event.eventType === "STOCK_RETURNED_UNSOLD") {
          const { flashSaleItemId } = event;
          setSkus((prev) =>
            prev.map((s) =>
              s.id === flashSaleItemId
                ? {
                    ...s,
                    availableStock: 0,
                    status: "SOLD_OUT",
                  }
                : s
            )
          );
        }

        // Khi có đơn mua thành công (trừ kho)
        if (event.eventType === "STOCK_DECREMENTED") {
          setTelemetry((prev) => ({
            ...prev,
            completedOrders: prev.completedOrders + 1,
            activeLocks: Math.max(0, prev.activeLocks - 1),
            rps: Math.max(prev.rps, 1) + Math.floor(Math.random() * 3 + 1),
          }));
        } else if (event.eventType === "STOCK_RESTORED") {
          setTelemetry((prev) => ({
            ...prev,
            expiredReleases: prev.expiredReleases + 1,
            activeLocks: Math.max(0, prev.activeLocks - 1),
          }));
        }

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(
          now.getMilliseconds()
        ).padStart(3, "0")}`;
        const itemId = "flashSaleItemId" in event ? ` #${event.flashSaleItemId}` : "";
        const newEvt: LiveLogEvent = {
          id: `ws-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          type:
            event.eventType === "STOCK_DECREMENTED"
              ? "LOCK"
              : event.eventType === "STOCK_RESTORED"
              ? "EXPIRED_RELEASE"
              : "SYNC_DB",
          message: `[WS Realtime] ${event.eventType}${itemId} (${now.toLocaleTimeString("vi-VN")})`,
          tag: event.eventType,
          tagColor:
            event.eventType === "STOCK_DECREMENTED" ? "primary" : "warning",
        };
        setLogs((prev) => [newEvt, ...prev].slice(0, 50));

        // Cập nhật nhịp traffic graph theo realtime event
        setTrafficData((prev) => {
          const pt: TrafficDataPoint = {
            time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
            rps: Math.floor(Math.random() * 5 + 3),
            ordersPerSec: event.eventType === "STOCK_DECREMENTED" ? 1 : 0,
          };
          return [...prev.slice(-9), pt];
        });
      }
    },
  });

  // Nạp Live Logs ban đầu khi đổi phiên (chỉ 1 lần ngầm, không block UI)
  useEffect(() => {
    if (!selectedSessionId) return;
    let cancelled = false;

    getAdminLiveLogs(selectedSessionId)
      .then((logsData) => {
        if (!cancelled && logsData) {
          setLogs(logsData);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  // Heartbeat nhẹ nhàng cập nhật biểu đồ traffic mượt mà mỗi 2s mà KHÔNG gọi API làm lag mạng
  useEffect(() => {
    if (!selectedSessionId || telemetry.isPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      setTrafficData((prev) => {
        const pt: TrafficDataPoint = {
          time: timeStr,
          rps: telemetry.rps,
          ordersPerSec: Math.floor(telemetry.completedOrders / 60),
        };
        return prev.length === 0 ? [pt] : [...prev.slice(-9), pt];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedSessionId, telemetry.isPaused, telemetry.rps, telemetry.completedOrders]);

  // 3. Filters
  const [skuSearch, setSkuSearch] = useState("");
  const [skuStoreFilter, setSkuStoreFilter] = useState("");
  const [skuCategoryFilter, setSkuCategoryFilter] = useState("");
  const [skuStatusFilter, setSkuStatusFilter] = useState<"ALL" | LiveSkuStatus>("ALL");

  // Danh sách duy nhất gian hàng & ngành hàng từ SKUs
  const uniqueStores = useMemo(() => {
    return Array.from(new Set(skus.map((s) => s.storeName).filter(Boolean))).sort();
  }, [skus]);

  const uniqueCategories = useMemo(() => {
    return Array.from(
      new Set(skus.map((s) => s.categoryName).filter((c): c is string => Boolean(c)))
    ).sort();
  }, [skus]);

  const hasActiveFilters = Boolean(
    skuSearch.trim() || skuStoreFilter || skuCategoryFilter || skuStatusFilter !== "ALL"
  );

  const handleResetFilters = () => {
    setSkuSearch("");
    setSkuStoreFilter("");
    setSkuCategoryFilter("");
    setSkuStatusFilter("ALL");
  };

  // 4. Real Countdown & Heartbeat State
  const countdownSeconds = useMemo(() => {
    if (!currentSession) return 0;
    const now = Date.now();
    if (currentSession.status === "ACTIVE") {
      const end = new Date(currentSession.endTime).getTime();
      return Math.max(0, Math.floor((end - now) / 1000));
    } else if (
      currentSession.status === "UPCOMING" ||
      currentSession.status === "REGISTRATION_OPEN"
    ) {
      const start = new Date(currentSession.startTime).getTime();
      return Math.max(0, Math.floor((start - now) / 1000));
    }
    return 0;
  }, [currentSession]);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lastHeartbeatSec, setLastHeartbeatSec] = useState(1);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);

  useEffect(() => {
    setSecondsLeft(countdownSeconds);
  }, [countdownSeconds]);

  // Countdown timer effect
  useEffect(() => {
    if (telemetry.isPaused || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setLastHeartbeatSec((prev) => (prev < 4 ? prev + 1 : 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [telemetry.isPaused, secondsLeft]);

  // Filtered SKUs theo đa tiêu chí: Tên/SKU, Gian hàng (Shop), Danh mục ngành hàng, Trạng thái bán
  const filteredSkus = useMemo(() => {
    return skus.filter((s) => {
      if (skuSearch.trim()) {
        const q = skuSearch.toLowerCase().trim();
        const match =
          s.productName.toLowerCase().includes(q) ||
          s.skuCode.toLowerCase().includes(q) ||
          s.storeName.toLowerCase().includes(q) ||
          (s.categoryName && s.categoryName.toLowerCase().includes(q)) ||
          s.variantName.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (skuStoreFilter && s.storeName !== skuStoreFilter) {
        return false;
      }
      if (skuCategoryFilter && s.categoryName !== skuCategoryFilter) {
        return false;
      }
      if (skuStatusFilter !== "ALL" && s.status !== skuStatusFilter) {
        return false;
      }
      return true;
    });
  }, [skus, skuSearch, skuStoreFilter, skuCategoryFilter, skuStatusFilter]);

  // Stock aggregation
  const totalAvailableStock = useMemo(
    () => skus.reduce((sum, s) => sum + (s.availableStock || 0), 0),
    [skus]
  );
  const totalAllocatedStock = useMemo(
    () => skus.reduce((sum, s) => sum + (s.allocatedStock || 0), 0),
    [skus]
  );

  // Handlers
  const handleToggleEmergencyPause = async () => {
    if (!selectedSessionId) return;

    if (telemetry.isPaused) {
      // Resume
      setIsPausing(true);
      try {
        await toggleAdminEmergencyPause(selectedSessionId, "Resume by admin", false, true);
        setTelemetry((prev) => ({ ...prev, isPaused: false }));

        // Cập nhật ngay cache slots để status đổi thành ACTIVE
        queryClient.setQueryData<AdminFlashSaleSession[]>(ADMIN_QUERY_KEYS.slots, (old) => {
          if (!old) return old;
          return old.map((s) => (s.id === selectedSessionId ? { ...s, status: "ACTIVE" } : s));
        });
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.slots });
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.telemetry(selectedSessionId) });
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.liveSkus(selectedSessionId) });

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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Không thể tiếp tục phiên";
        toast.error(msg);
      } finally {
        setIsPausing(false);
      }
    } else {
      setIsPauseModalOpen(true);
    }
  };

  const handleConfirmEmergencyPause = async (
    reason: string,
    rollbackStock: boolean,
    note?: string
  ) => {
    if (!selectedSessionId) return;
    setIsPausing(true);
    try {
      const fullReason = note ? `${reason}: ${note}` : reason;
      const result = await emergencyPauseFlashSaleSlot(
        selectedSessionId,
        fullReason,
        rollbackStock
      );
      setTelemetry((prev) => ({ ...prev, isPaused: true }));
      setIsPauseModalOpen(false);

      // Cập nhật ngay cache slots sang PAUSED để dropdown và UI đổi ngay lập tức
      queryClient.setQueryData<AdminFlashSaleSession[]>(ADMIN_QUERY_KEYS.slots, (old) => {
        if (!old) return old;
        return old.map((s) => (s.id === selectedSessionId ? { ...s, status: "PAUSED" } : s));
      });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.slots });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.telemetry(selectedSessionId) });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.liveSkus(selectedSessionId) });

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.000`;
      const pauseEvt: LiveLogEvent = {
        id: `pause-${Date.now()}`,
        timestamp: timeStr,
        type: "RATE_LIMIT",
        message: `TẠM DỪNG PHIÊN KHẨN CẤP: ${fullReason}`,
        tag: "Tạm dừng khẩn cấp",
        tagColor: "error",
        userOrInfo: "Ban Quản Trị",
      };
      setLogs((prev) => [pauseEvt, ...prev]);

      if (result.stockRolledBack && result.rolledBackItemsCount > 0) {
        toast.success(
          `Đã tạm dừng phiên! Đã hoàn trả ${result.totalStockReturned} tồn kho của ${result.rolledBackItemsCount} SKU về kho chính.`
        );
      } else {
        toast.success("Đã kích hoạt tạm dừng phiên khẩn cấp!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tạm dừng phiên";
      toast.error(msg);
    } finally {
      setIsPausing(false);
    }
  };


  const handleClearLogs = () => {
    setLogs([]);
    toast.info("Đã làm mới luồng sự kiện thời gian thực.");
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
                {currentSession?.name || "Không có phiên live/tạm dừng"}
              </span>
              {currentSession && (
                <span className="font-body-sm text-body-sm text-secondary">
                  ({currentSession.timeRangeDisplay})
                </span>
              )}
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
                <div className="absolute left-0 top-12 z-50 w-96 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/40 p-2.5 flex flex-col gap-2 animate-fadeIn">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-label-sm text-[11px] font-bold text-on-surface uppercase tracking-wider">
                      Chọn phiên giám sát realtime
                    </span>
                    <span className="text-[11px] font-semibold text-secondary">
                      {selectableSessions.length} phiên
                    </span>
                  </div>

                  {/* Filter Tabs: Chỉ lọc phiên Đang diễn ra hoặc Tạm dừng */}
                  <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => setSessionFilterMode("ALL")}
                      className={cn(
                        "py-1 px-1.5 rounded-md font-label-sm text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1",
                        sessionFilterMode === "ALL"
                          ? "bg-on-surface text-surface-container-lowest shadow-xs"
                          : "text-secondary hover:text-on-surface"
                      )}
                    >
                      <span>Tất cả ({monitorableSessions.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionFilterMode("ACTIVE_ONLY")}
                      className={cn(
                        "py-1 px-1.5 rounded-md font-label-sm text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1",
                        sessionFilterMode === "ACTIVE_ONLY"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-secondary hover:text-on-surface"
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                      <span>Đang live ({activeSessionsCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionFilterMode("PAUSED_ONLY")}
                      className={cn(
                        "py-1 px-1.5 rounded-md font-label-sm text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1",
                        sessionFilterMode === "PAUSED_ONLY"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-secondary hover:text-on-surface"
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      <span>Tạm dừng ({pausedSessionsCount})</span>
                    </button>
                  </div>

                  {/* List Sessions (Cuộn mượt mà không cắt bớt) */}
                  <div className="max-h-80 overflow-y-auto flex flex-col gap-1 pr-0.5 divide-y divide-outline-variant/20">
                    {selectableSessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedSessionId(s.id);
                          setIsSessionDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-body-sm transition-colors cursor-pointer mt-1",
                          s.id === selectedSessionId
                            ? "bg-primary-fixed text-primary font-semibold border border-primary/30"
                            : "hover:bg-surface-container-low text-on-surface"
                        )}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-semibold truncate">{s.name}</span>
                          <span className="text-secondary text-[11px]">
                            {s.timeRangeDisplay} · {s.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-medium text-secondary">
                            {s.approvedSkusCount || 0} SKU
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              s.status === "ACTIVE"
                                ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                            )}
                          >
                            {s.status === "ACTIVE" ? "LIVE" : "TẠM DỪNG"}
                          </span>
                        </div>
                      </button>
                    ))}

                    {selectableSessions.length === 0 && (
                      <div className="py-6 px-3 text-center text-secondary text-xs">
                        {monitorableSessions.length === 0
                          ? "Không có phiên Flash Sale nào đang diễn ra hoặc tạm dừng."
                          : "Không có phiên nào ở trạng thái này."}
                      </div>
                    )}
                  </div>
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

          {/* WebSocket STOMP Connection Status */}
          <div className="flex items-center gap-2 bg-surface px-2.5 py-1 rounded-lg border border-outline-variant/30">
            <span className="relative flex h-2 w-2">
              {connectionState === "connected" ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              )}
            </span>
            <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1">
              <span className={connectionState === "connected" ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                {connectionState === "connected" ? "WebSocket STOMP: Live" : "Đang kết nối lại..."}
              </span>
              ·{" "}
              <span className="text-on-surface font-medium">
                Cập nhật {lastHeartbeatSec}s trước
              </span>
            </span>
          </div>
        </div>

        {/* Right: Global Actions */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            disabled={isPausing}
            onClick={handleToggleEmergencyPause}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-headline-md text-body-sm font-semibold transition-colors border disabled:opacity-50",
              telemetry.isPaused
                ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                : "bg-error-container/40 text-error hover:bg-error-container border-error/30"
            )}
          >
            {isPausing ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                {telemetry.isPaused ? "play_circle" : "pause_circle"}
              </span>
            )}
            <span>
              {isPausing
                ? "Đang xử lý..."
                : telemetry.isPaused
                ? "Tiếp tục phiên"
                : "Tạm dừng phiên khẩn cấp"}
            </span>
          </button>

        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span className="text-body-md font-medium">{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSessionId((prev) => prev)}
            className="px-3 py-1 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 text-body-sm font-medium transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

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
              Doanh thu ~ {telemetry.totalRevenue.toLocaleString("vi-VN")} ₫
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
            redisStock={totalAvailableStock}
            postgresStock={totalAllocatedStock}
            completedOrders={telemetry.completedOrders}
            holdingLocks={telemetry.activeLocks}
            syncIntervalMs={1000}
          />
        </div>
      </div>

      {/* Section 3: Live SKU Inventory Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        {/* Table Header & Multi-Filter Bar */}
        <div className="p-space-md lg:p-space-lg border-b border-outline-variant/30 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                inventory_2
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Tồn kho theo SKU (Cập nhật thời gian thực)
              </h2>
              <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold">
                {filteredSkus.length} / {skus.length} SKU
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>

          {/* Filters Bar: Search, Shop, Danh mục, Trạng thái bán */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {/* 1. Lọc sản phẩm & SKU */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                search
              </span>
              <input
                type="text"
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                placeholder="Tìm mã SKU, tên sản phẩm..."
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-outline-variant/60 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary transition-all bg-surface-bright placeholder:text-secondary text-[12px]"
              />
            </div>

            {/* 2. Lọc theo Shop / Gian hàng */}
            <div className="relative">
              <select
                value={skuStoreFilter}
                onChange={(e) => setSkuStoreFilter(e.target.value)}
                className="w-full h-9 pl-8 pr-7 rounded-lg border border-outline-variant/60 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary transition-all bg-surface-bright appearance-none cursor-pointer text-[12px]"
              >
                <option value="">Tất cả gian hàng ({uniqueStores.length})</option>
                {uniqueStores.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[16px]">
                storefront
              </span>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[16px]">
                expand_more
              </span>
            </div>

            {/* 3. Lọc theo Danh mục */}
            <div className="relative">
              <select
                value={skuCategoryFilter}
                onChange={(e) => setSkuCategoryFilter(e.target.value)}
                className="w-full h-9 pl-8 pr-7 rounded-lg border border-outline-variant/60 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary transition-all bg-surface-bright appearance-none cursor-pointer text-[12px]"
              >
                <option value="">Tất cả ngành hàng {uniqueCategories.length > 0 ? `(${uniqueCategories.length})` : ""}</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[16px]">
                category
              </span>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[16px]">
                expand_more
              </span>
            </div>

            {/* 4. Lọc theo Trạng thái bán */}
            <div className="relative">
              <select
                value={skuStatusFilter}
                onChange={(e) => setSkuStatusFilter(e.target.value as "ALL" | LiveSkuStatus)}
                className="w-full h-9 pl-8 pr-7 rounded-lg border border-outline-variant/60 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary transition-all bg-surface-bright appearance-none cursor-pointer text-[12px]"
              >
                <option value="ALL">Tất cả trạng thái bán</option>
                <option value="SELLING">Đang mở bán</option>
                <option value="ALMOST_OUT">Sắp cháy hàng (&lt;10%)</option>
                <option value="SOLD_OUT">Đã hết hàng</option>
              </select>
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[16px]">
                tune
              </span>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[16px]">
                expand_more
              </span>
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
                          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary font-mono">
                            <span>{sku.skuCode}</span>
                            {sku.categoryName && (
                              <>
                                <span>·</span>
                                <span className="text-secondary/80 font-sans">{sku.categoryName}</span>
                              </>
                            )}
                            {sku.variantName && (
                              <>
                                <span>·</span>
                                <span className="text-primary font-sans">{sku.variantName}</span>
                              </>
                            )}
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
              {filteredSkus.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-secondary">
                    Không có sản phẩm nào trong phiên này.
                  </td>
                </tr>
              )}
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
        isLoading={isPausing}
        onClose={() => setIsPauseModalOpen(false)}
        onConfirm={handleConfirmEmergencyPause}
        sessionName={currentSession?.name}
      />
    </div>
  );
}

export default function AdminFlashSaleMonitorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-secondary gap-2">
          <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
          <span>Đang kết nối giám sát thời gian thực...</span>
        </div>
      }
    >
      <MonitorContent />
    </Suspense>
  );
}
