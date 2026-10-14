export interface ApiResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T = unknown> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiErrorResponse {
  success: false;
  code: number;
  message: string;
  data: null | Record<string, unknown>;
  timestamp: string;
}

export interface ServerTimeResponse {
  serverTime: string; // ISO 8601
  timestampMs: number;
  timezone: string;
}
