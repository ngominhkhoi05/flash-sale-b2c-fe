"use client";

import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AdminFlashSaleSession } from "@/types/flash-sale";
import { getMonday, formatDate, formatDayMonth } from "@/lib/mocks/flash-sessions.mock";

const BASE_TIME_ROWS = ["00:00", "09:00", "12:00", "15:00", "18:00", "20:00"];

interface FlashSaleCalendarProps {
  sessions: AdminFlashSaleSession[];
  statusFilter?: string;
  onSelectSession?: (session: AdminFlashSaleSession) => void;
  onCreateSlot?: (date: string, time: string) => void;
}

function SessionCard({
  session,
  onSelect,
}: {
  session: AdminFlashSaleSession;
  onSelect?: (session: AdminFlashSaleSession) => void;
}) {
  if (session.status === "ACTIVE") {
    const percent =
      session.allocatedQuantity > 0
        ? Math.min(100, Math.round((session.soldQuantity / session.allocatedQuantity) * 100))
        : 0;

    return (
      <div
        onClick={() => onSelect?.(session)}
        className="rounded-xl bg-tertiary-fixed border-2 border-tertiary p-2.5 flex flex-col justify-between shadow-md relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      >
        <div className="absolute -right-3 -top-3 w-12 h-12 bg-tertiary/10 rounded-full pointer-events-none" />
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 font-headline-md text-body-sm text-on-tertiary-fixed-variant font-bold truncate">
              <span
                className="material-symbols-outlined text-tertiary text-[17px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
              <span className="truncate">{session.name}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-label-sm bg-tertiary text-on-tertiary font-bold tracking-wider animate-pulse shrink-0">
              ĐANG CHẠY
            </span>
          </div>
          <div className="font-data-tabular text-body-sm text-tertiary font-semibold mt-1">
            {session.timeRangeDisplay}
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-tertiary/20">
          <div className="flex items-center justify-between font-label-md text-label-md">
            <span className="text-on-tertiary-fixed-variant font-medium text-[11px]">
              {session.approvedSkusCount > 0 ? `${session.approvedSkusCount} SKU` : "0 SKU"}
            </span>
            <span className="text-tertiary font-bold text-[11px]">
              {session.allocatedQuantity > 0 ? `Đã bán ${percent}%` : "Chưa bán"}
            </span>
          </div>
          <div className="w-full bg-surface-container-lowest/80 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-tertiary h-full rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (session.status === "REGISTRATION_OPEN") {
    return (
      <div
        onClick={() => onSelect?.(session)}
        className="rounded-lg bg-surface-container-high/60 border border-primary/40 p-2.5 flex flex-col gap-1.5 shadow-xs hover:border-primary hover:shadow-sm transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-label-sm text-label-sm text-primary font-semibold">
            {session.timeRangeDisplay}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-label-sm bg-surface-container text-primary font-bold shrink-0">
            MỞ ĐĂNG KÝ
          </span>
        </div>
        <div className="font-headline-md text-body-sm text-on-surface font-semibold truncate">
          {session.name}
        </div>
        <div className="font-label-sm text-label-sm text-secondary flex flex-col gap-0.5">
          <span className="text-error font-medium text-[11px]">
            {session.pendingSkusCount > 0
              ? `${session.pendingSkusCount} SKU chờ duyệt`
              : session.approvedSkusCount > 0
              ? `${session.approvedSkusCount} SKU đã duyệt`
              : "Chờ nộp SKU"}
          </span>
        </div>
      </div>
    );
  }

  if (session.status === "ENDED") {
    return (
      <div
        onClick={() => onSelect?.(session)}
        className="rounded-lg bg-surface border border-outline-variant/60 p-2 flex flex-col gap-1 hover:border-outline hover:shadow-xs transition-all cursor-pointer bg-slate-50/80 dark:bg-slate-900/40"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-label-sm text-label-sm text-secondary font-medium">
            {session.timeRangeDisplay}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-label-sm bg-surface-container text-secondary font-semibold shrink-0">
            ĐÃ KẾT THÚC
          </span>
        </div>
        <div className="font-headline-md text-body-sm text-on-surface font-medium truncate">
          {session.name}
        </div>
        <div className="flex items-center justify-between font-label-sm text-label-sm text-secondary mt-0.5">
          <span>{session.approvedSkusCount} SKU</span>
          <span className="text-on-surface font-semibold text-[11px]">
            {session.soldQuantity > 0 ? `Đã bán ${session.soldQuantity}` : "Hoàn tất"}
          </span>
        </div>
      </div>
    );
  }

  // Default: UPCOMING (Sắp diễn ra)
  return (
    <div
      onClick={() => onSelect?.(session)}
      className="rounded-lg bg-surface-container-low border border-outline-variant/60 p-2 flex flex-col gap-1 hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-label-sm text-label-sm text-secondary font-medium">
          {session.timeRangeDisplay}
        </span>
        <span className="px-1.5 py-0.2 rounded text-[10px] font-label-sm bg-primary-fixed text-primary font-semibold shrink-0">
          SẮP TỚI
        </span>
      </div>
      <span className="font-headline-md text-body-sm text-on-surface font-medium truncate">
        {session.name}
      </span>
      <div className="flex items-center justify-between font-label-sm text-label-sm mt-0.5">
        <span className="text-primary font-medium text-[11px]">
          {session.approvedSkusCount > 0
            ? `${session.approvedSkusCount} SKU đã chốt`
            : session.pendingSkusCount > 0
            ? `${session.pendingSkusCount} SKU chờ duyệt`
            : "Chờ duyệt SKU"}
        </span>
        {session.pendingSkusCount > 0 && session.approvedSkusCount > 0 && (
          <span className="text-error font-medium text-[10px]">
            +{session.pendingSkusCount} chờ
          </span>
        )}
      </div>
    </div>
  );
}

export function FlashSaleCalendar({
  sessions,
  statusFilter = "ALL",
  onSelectSession,
  onCreateSlot,
}: FlashSaleCalendarProps) {
  // Quản lý tuần hiển thị (tính từ Thứ Hai)
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));

  // 7 ngày trong tuần
  const weekDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayName: string; dayNum: string; isToday: boolean }[] = [];
    const todayStr = formatDate(new Date());

    const dayLabels = [
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
      "Chủ Nhật",
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      const dateStr = formatDate(d);
      days.push({
        date: d,
        dateStr,
        dayName: dayLabels[i],
        dayNum: String(d.getDate()).padStart(2, "0"),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [currentMonday]);

  // Điều hướng tuần
  const handlePrevWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() - 7);
    setCurrentMonday(next);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  const handleToday = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Kiểm tra xem có đang ở tuần hiện tại không
  const isCurrentWeek = useMemo(() => {
    const thisMonday = getMonday(new Date());
    return formatDate(thisMonday) === formatDate(currentMonday);
  }, [currentMonday]);

  // Tiêu đề tuần
  const sunday = new Date(currentMonday);
  sunday.setDate(sunday.getDate() + 6);
  const weekTitle = isCurrentWeek
    ? `Tuần này (${formatDayMonth(currentMonday)} - ${formatDayMonth(sunday)}/${sunday.getFullYear()})`
    : `Tuần ${formatDayMonth(currentMonday)} - ${formatDayMonth(sunday)}/${sunday.getFullYear()}`;

  // Tự động nhảy tuần khi người dùng click vào bộ lọc trạng thái nếu tuần hiện tại không có phiên
  useEffect(() => {
    if (statusFilter && statusFilter !== "ALL") {
      const matching = sessions.filter((s) => s.status === statusFilter);
      if (matching.length > 0) {
        const weekDates = new Set(weekDays.map((d) => d.dateStr));
        const hasInWeek = matching.some((s) => weekDates.has(s.date));
        if (!hasInWeek) {
          // Nhảy ngay đến tuần chứa phiên gần nhất của trạng thái này
          const nearestSession = matching[0];
          if (nearestSession?.date) {
            setCurrentMonday(getMonday(new Date(nearestSession.date)));
          }
        }
      }
    }
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Thu thập danh sách các mốc giờ: kết hợp mốc cơ sở với bất kỳ mốc giờ thực tế nào của các phiên trong tuần
  const timeRows = useMemo(() => {
    const weekDateSet = new Set(weekDays.map((d) => d.dateStr));
    const sessionHours = sessions
      .filter((s) => weekDateSet.has(s.date))
      .map((s) => {
        const raw = s.timeRangeDisplay?.split(" - ")[0]?.trim();
        return raw || "00:00";
      });

    return Array.from(new Set([...BASE_TIME_ROWS, ...sessionHours])).sort();
  }, [weekDays, sessions]);

  // Index sessions theo `date_timeRow` -> cho phép nhiều phiên cùng ô
  const sessionMap = useMemo(() => {
    const map = new Map<string, AdminFlashSaleSession[]>();
    for (const s of sessions) {
      if (statusFilter && statusFilter !== "ALL" && s.status !== statusFilter) {
        continue;
      }
      const startHour = s.timeRangeDisplay?.split(" - ")[0]?.trim() || "00:00";
      const key = `${s.date}_${startHour}`;
      const list = map.get(key) || [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [sessions, statusFilter]);

  // Banner hỗ trợ: nếu bộ lọc đang chọn không có phiên nào trong tuần này nhưng có ở tuần khác
  const filterSummary = useMemo(() => {
    if (!statusFilter || statusFilter === "ALL") return null;

    const matching = sessions.filter((s) => s.status === statusFilter);
    if (matching.length === 0) return null;

    const weekDates = new Set(weekDays.map((d) => d.dateStr));
    const inCurrentWeek = matching.filter((s) => weekDates.has(s.date));
    if (inCurrentWeek.length > 0) return null;

    // Tìm phiên gần nhất với tuần hiện tại
    const currentMondayTime = currentMonday.getTime();
    const sorted = [...matching].sort((a, b) => {
      const diffA = Math.abs(new Date(a.date).getTime() - currentMondayTime);
      const diffB = Math.abs(new Date(b.date).getTime() - currentMondayTime);
      return diffA - diffB;
    });

    const nearestSession = sorted[0];

    const statusLabels: Record<string, string> = {
      ACTIVE: "Đang diễn ra",
      UPCOMING: "Sắp diễn ra",
      REGISTRATION_OPEN: "Đang mở đăng ký",
      ENDED: "Đã kết thúc",
    };

    return {
      statusLabel: statusLabels[statusFilter] || statusFilter,
      count: matching.length,
      nearestSession,
    };
  }, [sessions, statusFilter, weekDays, currentMonday]);

  return (
    <div className="flex flex-col rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm overflow-hidden select-none">
      {/* Calendar Navigation Bar */}
      <div className="p-space-md border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-md bg-surface-bright">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-0.5 shadow-xs">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Tuần trước"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div className="px-3 py-1 font-headline-md text-body-md text-on-surface font-semibold tracking-tight min-w-[210px] text-center">
              {weekTitle}
            </div>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Tuần kế"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleToday}
            className={cn(
              "px-3 py-1.5 rounded-lg border font-label-md text-label-md transition-all cursor-pointer flex items-center gap-1.5",
              isCurrentWeek
                ? "border-outline-variant/50 text-secondary bg-surface-container-low/50 hover:bg-surface-container"
                : "border-primary bg-primary/10 text-primary font-semibold hover:bg-primary/20 shadow-xs"
            )}
          >
            {!isCurrentWeek && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
            <span>{isCurrentWeek ? "Hôm nay" : "Về tuần này"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-secondary font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
          <span>
            Múi giờ chuẩn: <span className="font-medium text-on-surface">GMT+7 (Indochina Time)</span>
          </span>
        </div>
      </div>

      {/* Thông báo điều hướng tuần thông minh khi đang lọc */}
      {filterSummary && (
        <div className="m-space-md p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-wrap items-center justify-between gap-3 text-sm animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400 shrink-0">
              info
            </span>
            <span>
              Tuần đang xem ({formatDayMonth(currentMonday)} - {formatDayMonth(sunday)}) không có phiên nào <strong>&quot;{filterSummary.statusLabel}&quot;</strong>. Có <strong>{filterSummary.count} phiên</strong> ở tuần khác.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (filterSummary.nearestSession?.date) {
                setCurrentMonday(getMonday(new Date(filterSummary.nearestSession.date)));
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-headline-md text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            <span>Chuyển đến tuần có phiên ({filterSummary.nearestSession.date})</span>
          </button>
        </div>
      )}

      {/* Weekly Calendar Grid Body */}
      <div className="overflow-x-auto">
        <div className="min-w-[1040px] grid grid-cols-[80px_repeat(7,1fr)] bg-outline-variant/20 gap-px">
          {/* Header row: Cột giờ */}
          <div className="bg-surface-container-low p-3 flex items-center justify-center font-label-sm text-label-sm text-secondary uppercase font-semibold">
            Giờ
          </div>

          {/* Header row: 7 ngày */}
          {weekDays.map((day) => (
            <div
              key={day.dateStr}
              className={cn(
                "p-3 flex flex-col items-center justify-center relative",
                day.isToday
                  ? "bg-surface-container-high/60 border-b-2 border-primary"
                  : "bg-surface-container-low"
              )}
            >
              <span
                className={cn(
                  "font-label-sm text-label-sm uppercase font-semibold",
                  day.isToday ? "font-bold text-primary" : "text-secondary"
                )}
              >
                {day.dayName}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={cn(
                    "text-body-sm flex items-center justify-center",
                    day.isToday
                      ? "h-6 w-6 rounded-full bg-primary text-on-primary font-headline-md font-bold"
                      : "font-headline-md text-body-md text-on-surface font-semibold"
                  )}
                >
                  {day.dayNum}
                </span>
                <span className="font-label-sm text-label-sm text-secondary">
                  Tháng {day.date.getMonth() + 1}
                </span>
              </div>
              {day.isToday && (
                <span className="mt-0.5 px-1.5 py-0.2 rounded font-label-sm text-[10px] bg-primary-fixed text-on-primary-fixed-variant uppercase font-semibold">
                  Hôm nay
                </span>
              )}
            </div>
          ))}

          {/* Time Rows */}
          {timeRows.map((time) => (
            <div key={time} className="contents">
              {/* Cột mốc giờ */}
              <div className="bg-surface-bright py-5 px-2 flex items-center justify-center font-data-tabular text-body-sm text-secondary font-medium border-t border-outline-variant/10">
                {time}
              </div>

              {/* 7 ô tương ứng với 7 ngày */}
              {weekDays.map((day) => {
                const cellSessions = sessionMap.get(`${day.dateStr}_${time}`) || [];

                if (cellSessions.length === 0) {
                  return (
                    <div
                      key={`${day.dateStr}_${time}`}
                      onClick={() => onCreateSlot?.(day.dateStr, time)}
                      className="bg-surface-container-lowest p-2 min-h-[95px] flex items-center justify-center group hover:bg-surface-container-low/40 cursor-pointer transition-colors"
                      title={`Tạo khung giờ lúc ${time} ngày ${day.dateStr}`}
                    >
                      <span className="material-symbols-outlined text-outline-variant/60 group-hover:text-primary group-hover:scale-110 transition-all text-[20px]">
                        add
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={`${day.dateStr}_${time}`}
                    className="bg-surface-container-lowest p-1.5 min-h-[95px] flex flex-col gap-1.5"
                  >
                    {cellSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onSelect={onSelectSession}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
