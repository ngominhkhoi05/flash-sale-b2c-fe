"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { WsConnectionProvider } from "./WsConnectionProvider";
import { SessionCookieBridge } from "./SessionCookieBridge";
import { NetworkStatusListener } from "./NetworkStatusListener";

/**
 * Providers gốc – mount trong app/layout.tsx.
 * - QueryClientProvider: cache dữ liệu server.
 * - WsConnectionProvider: mount STOMP context (lazy).
 * - SessionCookieBridge: đồng bộ access_token localStorage <-> cookie.
 * - <Toaster/>: thông báo kết quả (rule §7).
 * - <NetworkStatusListener/>: cảnh báo mất mạng thời gian thực.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <SessionCookieBridge />
      <NetworkStatusListener />
      <WsConnectionProvider>{children}</WsConnectionProvider>
      <Toaster richColors position="top-right" duration={4000} />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
