"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { AdminFlashSaleSession } from "@/types/flash-sale";
import { getMonday, formatDate, formatDayMonth } from "@/lib/mocks/flash-sessions.mock";

const TIME_ROWS = ["00:00", "09:00", "12:00", "15:00", "18:00", "20:00"];

interface FlashSaleCalendarProps {
  sessions: AdminFlashSaleSession[];
  onSelectSession?: (session: AdminFlashSaleSession) => void;
  onCreateSlot?: (date: string, time: string) => void;
}

export function FlashSaleCalendar({
  sessions,
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

  // Tiêu đề tuần
  const sunday = new Date(currentMonday);
  sunday.setDate(sunday.getDate() + 6);
  const weekTitle = `Tuần này (${formatDayMonth(currentMonday)} - ${formatDayMonth(sunday)}/${sunday.getFullYear()})`;

  // Index sessions theo `date_timeRow`
  const sessionMap = useMemo(() => {
    const map = new Map<string, AdminFlashSaleSession>();
    for (const s of sessions) {
      // s.timeRangeDisplay dạng "12:00 - 14:00" -> lấy startTime
      const startHour = s.timeRangeDisplay.split(" - ")[0] || "00:00";
      // Map về time row gần nhất hoặc chính xác
      const matchedRow = TIME_ROWS.find((r) => r === startHour) || startHour;
      map.set(`${s.date}_${matchedRow}`, s);
    }
    return map;
  }, [sessions]);

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
            <div className="px-3 py-1 font-headline-md text-body-md text-on-surface font-semibold tracking-tight">
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
            className="px-3 py-1.5 rounded-lg border border-outline-variant/50 hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
        </div>
        <div className="flex items-center gap-2 text-secondary font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
          <span>
            Múi giờ chuẩn: <span className="font-medium text-on-surface">GMT+7 (Indochina Time)</span>
          </span>
        </div>
      </div>

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
          {TIME_ROWS.map((time) => (
            <div key={time} className="contents">
              {/* Cột mốc giờ */}
              <div className="bg-surface-bright py-5 px-2 flex items-center justify-center font-data-tabular text-body-sm text-secondary font-medium border-t border-outline-variant/10">
                {time}
              </div>

              {/* 7 ô tương ứng với 7 ngày */}
              {weekDays.map((day) => {
                const session = sessionMap.get(`${day.dateStr}_${time}`);

                if (!session) {
                  return (
                    <div
                      key={`${day.dateStr}_${time}`}
                      onClick={() => onCreateSlot?.(day.dateStr, time)}
                      className="bg-surface-container-lowest p-2 min-h-[90px] flex items-center justify-center group hover:bg-surface-container-low/40 cursor-pointer transition-colors"
                      title={`Tạo khung giờ lúc ${time} ngày ${day.dateStr}`}
                    >
                      <span className="material-symbols-outlined text-outline-variant/60 group-hover:text-primary group-hover:scale-110 transition-all text-[20px]">
                        add
                      </span>
                    </div>
                  );
                }

                // Render session card based on status
                if (session.status === "ACTIVE") {
                  const percent = session.allocatedQuantity > 0
                    ? Math.round((session.soldQuantity / session.allocatedQuantity) * 100)
                    : 78;

                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession?.(session)}
                      className="bg-surface-container-lowest p-1.5 min-h-[110px] relative ring-2 ring-inset ring-tertiary/20 cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="h-full rounded-xl bg-tertiary-fixed border-2 border-tertiary p-2.5 flex flex-col justify-between shadow-md relative overflow-hidden">
                        <div className="absolute -right-3 -top-3 w-12 h-12 bg-tertiary/10 rounded-full pointer-events-none" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-headline-md text-body-sm text-on-tertiary-fixed-variant font-bold truncate">
                              <span
                                className="material-symbols-outlined text-tertiary text-[17px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                bolt
                              </span>
                              {session.name}
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
                              {session.approvedSkusCount}/{session.approvedSkusCount} SKU active
                            </span>
                            <span className="text-tertiary font-bold text-[11px]">
                              Đã bán {percent}%
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
                    </div>
                  );
                }

                if (session.status === "REGISTRATION_OPEN") {
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession?.(session)}
                      className="bg-surface-container-lowest p-2 min-h-[90px] cursor-pointer"
                    >
                      <div className="rounded-lg bg-surface-container-high/60 border border-primary/40 p-2.5 flex flex-col gap-1.5 shadow-xs hover:border-primary hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-primary font-semibold">
                            {session.timeRangeDisplay}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-label-sm bg-surface-container text-primary font-bold">
                            MỞ ĐĂNG KÝ
                          </span>
                        </div>
                        <div className="font-headline-md text-body-sm text-on-surface font-semibold truncate">
                          {session.name}
                        </div>
                        <div className="font-label-sm text-label-sm text-secondary flex flex-col gap-0.5">
                          <span className="text-error font-medium text-[11px]">
                            {session.pendingSkusCount > 0 ? `${session.pendingSkusCount} SKU chờ duyệt` : "Chờ nộp SKU"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (session.status === "ENDED") {
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession?.(session)}
                      className="bg-surface-container-lowest p-2 min-h-[90px] cursor-pointer"
                    >
                      <div className="rounded-lg bg-surface border border-outline-variant/50 p-2 flex flex-col gap-1 hover:shadow-xs transition-shadow">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-secondary font-medium">
                            {session.timeRangeDisplay}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-label-sm bg-surface-container text-secondary">
                            ĐÃ KẾT THÚC
                          </span>
                        </div>
                        <div className="font-headline-md text-body-sm text-on-surface font-medium truncate">
                          {session.name}
                        </div>
                        <div className="flex items-center justify-between font-label-sm text-label-sm text-secondary mt-1">
                          <span>{session.approvedSkusCount} SKU</span>
                          <span className="text-on-surface font-semibold text-[11px]">Hoàn tất</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default: UPCOMING (Sắp diễn ra)
                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession?.(session)}
                    className="bg-surface-container-lowest p-2 min-h-[90px] cursor-pointer"
                  >
                    <div className="rounded-lg bg-surface-container-low border border-outline-variant/60 p-2 flex flex-col gap-1 hover:border-primary/50 hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-secondary font-medium">
                          {session.timeRangeDisplay}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-label-sm bg-primary-fixed text-primary font-semibold">
                          SẮP TỚI
                        </span>
                      </div>
                      <span className="font-headline-md text-body-sm text-on-surface font-medium truncate">
                        {session.name}
                      </span>
                      <span className="font-label-sm text-label-sm text-primary">
                        {session.approvedSkusCount} SKU đã chốt
                      </span>
                    </div>
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
