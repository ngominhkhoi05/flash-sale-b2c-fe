"use client";

import React, { useSyncExternalStore } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { TrafficDataPoint } from "@/types/flash-monitor";

interface TrafficChartProps {
  data: TrafficDataPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl border border-slate-700 font-data-tabular text-body-sm flex flex-col gap-1.5">
        <span className="font-semibold text-slate-300 text-[12px] border-b border-slate-700 pb-1">
          Thời điểm: {label}
        </span>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#38BDF8]">
            <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
            Request/giây:
          </span>
          <span className="font-bold tabular-nums">
            {payload[0]?.value?.toLocaleString("vi-VN")} rps
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#34D399]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            Đơn thành công:
          </span>
          <span className="font-bold tabular-nums">
            {payload[1]?.value?.toLocaleString("vi-VN")} đơn/s
          </span>
        </div>
      </div>
    );
  }
  return null;
}

const emptySubscribe = () => () => {};

export function TrafficChart({ data }: TrafficChartProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/20">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Lưu lượng truy cập &amp; Tỷ lệ chốt đơn (15 phút gần nhất)
          </h2>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">
            Mô phỏng đợt spike 8.200 req/s lúc 12:00:00 &amp; tốc độ xác nhận đơn
          </p>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center gap-space-md font-label-md text-label-md">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-[#0284C7]" />
            <span className="text-secondary font-medium">
              Request/giây (Trục trái)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-[#10B981]" />
            <span className="text-secondary font-medium">
              Đơn thành công/giây (Trục phải)
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-64 mt-space-md relative">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="reqGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="time"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${val.toLocaleString("vi-VN")}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="rps"
                name="Request/giây"
                stroke="#0284C7"
                strokeWidth={2.5}
                fill="url(#reqGradient)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ordersPerSec"
                name="Đơn thành công/giây"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ r: 3, fill: "#10B981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary text-body-sm">
            Đang tải dữ liệu lưu lượng...
          </div>
        )}
      </div>

      {/* Horizontal Time Scale Footer */}
      <div className="flex justify-between items-center text-secondary font-label-sm text-[11px] pt-space-xs mt-2 border-t border-outline-variant/30">
        <span>12:00:00 (Mở bán)</span>
        <span>12:03:00</span>
        <span>12:06:00</span>
        <span>12:09:00</span>
        <span>12:12:00</span>
        <span>12:15:00 (Hiện tại)</span>
      </div>
    </div>
  );
}
