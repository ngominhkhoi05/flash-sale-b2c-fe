import type { ServerTimeResponse } from "@/types/api";

export function getMockServerTime(): ServerTimeResponse {
  const now = new Date();
  return {
    serverTime: now.toISOString(),
    timestampMs: now.getTime(),
    timezone: "Asia/Ho_Chi_Minh",
  };
}
