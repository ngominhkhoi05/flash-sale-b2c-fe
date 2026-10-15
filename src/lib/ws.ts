import { Client, type IMessage, type StompConfig } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { StockRealtimeUpdate } from "@/types/flash-sale";

export type WsConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";

export type WsStatusListener = (status: WsConnectionStatus) => void;

/** Lấy WebSocket URL từ biến môi trường NEXT_PUBLIC_WS_URL */
export function getWsUrl(): string {
  const raw = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";
  return raw.replace(/\/$/, "");
}

/** Chỉ kích hoạt giả lập WS khi NEXT_PUBLIC_USE_MOCKS === "true" */
export function isMockWsMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
}

class FlashSaleWebSocketClient {
  private client: Client | null = null;
  private status: WsConnectionStatus = "DISCONNECTED";
  private statusListeners: Set<WsStatusListener> = new Set();
  private mockIntervalId: NodeJS.Timeout | null = null;
  private mockStockSubscribers: Map<string, Set<(update: StockRealtimeUpdate) => void>> =
    new Map();

  constructor() {
    // Tự động khởi tạo kết nối khi chạy ở client
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  public getStatus(): WsConnectionStatus {
    return this.status;
  }

  public onStatusChange(listener: WsStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(newStatus: WsConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((listener) => {
        try {
          listener(newStatus);
        } catch (err) {
          console.error("[ws.setStatus] WsStatusListener threw", err);
        }
      });
    }
  }

  public init(): void {
    if (this.client || typeof window === "undefined") return;

    this.setStatus("CONNECTING");
    const wsUrl = getWsUrl();

    const config: StompConfig = {
      webSocketFactory: () => new SockJS(wsUrl) as unknown as WebSocket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.setStatus("CONNECTED");
        this.stopMockSimulation();
      },
      onDisconnect: () => {
        this.setStatus("DISCONNECTED");
      },
      onStompError: (frame) => {
        console.warn(
          "[ws.onStompError] STOMP error frame:",
          frame.headers["message"],
        );
        this.setStatus("ERROR");
        if (isMockWsMode()) {
          this.startMockSimulation();
        }
      },
      onWebSocketClose: () => {
        this.setStatus("DISCONNECTED");
        if (isMockWsMode()) {
          this.startMockSimulation();
        }
      },
      onWebSocketError: () => {
        this.setStatus("ERROR");
        if (isMockWsMode()) {
          this.startMockSimulation();
        }
      },
      debug: () => {
        // Tắt log debug STOMP để tránh nhiễu console
      },
    };

    try {
      this.client = new Client(config);
      this.client.activate();
    } catch {
      this.setStatus("ERROR");
      if (isMockWsMode()) {
        this.startMockSimulation();
      }
    }
  }

  /**
   * Subscribe topic cập nhật tồn kho Flash Sale theo slot
   * Topic: /topic/flash-sale/{slotId}/stock
   */
  public subscribeStock(
    slotId: number,
    callback: (update: StockRealtimeUpdate) => void
  ): () => void {
    const destination = `/topic/flash-sale/${slotId}/stock`;

    // Lưu subscriber vào danh sách mock
    if (!this.mockStockSubscribers.has(destination)) {
      this.mockStockSubscribers.set(destination, new Set());
    }
    this.mockStockSubscribers.get(destination)!.add(callback);

    let stompSub: ReturnType<Client["subscribe"]> | null = null;

    if (this.client && this.client.connected) {
      stompSub = this.client.subscribe(destination, (msg: IMessage) => {
        try {
          const payload = JSON.parse(msg.body) as StockRealtimeUpdate;
          callback(payload);
        } catch (err) {
          console.error("[ws.subscribeStock] parse stock message failed", err);
        }
      });
    }

    return () => {
      this.mockStockSubscribers.get(destination)?.delete(callback);
      try {
        stompSub?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }

  /**
   * Subscribe kênh giám sát dành cho Admin
   * Topic: /topic/admin/flash-sale/monitoring
   */
  public subscribeAdminMonitoring(
    callback: (update: {
      slotId: number;
      totalOrders: number;
      velocity: number;
      timestamp: string;
    }) => void
  ): () => void {
    const destination = "/topic/admin/flash-sale/monitoring";
    let stompSub: ReturnType<Client["subscribe"]> | null = null;

    if (this.client && this.client.connected) {
      stompSub = this.client.subscribe(destination, (msg: IMessage) => {
        try {
          const payload = JSON.parse(msg.body);
          callback(payload);
        } catch (err) {
          console.error(
            "[ws.subscribeAdminMonitoring] parse admin monitor message failed",
            err,
          );
        }
      });
    }

    return () => {
      try {
        stompSub?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }

  /**
   * Giả lập cập nhật realtime khi BE chưa bật WebSocket
   * Tự động trừ 1 tồn kho của ngẫu nhiên sản phẩm mỗi 3-5 giây để kiểm thử giao diện
   */
  private startMockSimulation(): void {
    if (!isMockWsMode()) return;
    if (this.mockIntervalId) return;

    this.mockIntervalId = setInterval(() => {
      this.mockStockSubscribers.forEach((callbacks, destination) => {
        const slotMatch = destination.match(/\/topic\/flash-sale\/(\d+)\/stock/);
        const slotId = slotMatch ? Number(slotMatch[1]) : 102;

        // Bắn event mock stock cho item ngẫu nhiên
        const randomItemId = [1, 2, 3, 5, 6, 8, 9, 10][Math.floor(Math.random() * 8)];
        const update: StockRealtimeUpdate = {
          slotId,
          itemId: randomItemId,
          availableStock: Math.max(0, Math.floor(Math.random() * 30)),
          soldQuantity: Math.min(100, Math.floor(60 + Math.random() * 35)),
          isSoldOut: false,
          timestamp: new Date().toISOString(),
        };

        callbacks.forEach((cb) => {
          try {
            cb(update);
          } catch {
            // ignore
          }
        });
      });
    }, 4000);
  }

  private stopMockSimulation(): void {
    if (this.mockIntervalId) {
      clearInterval(this.mockIntervalId);
      this.mockIntervalId = null;
    }
  }

  public disconnect(): void {
    this.stopMockSimulation();
    try {
      this.client?.deactivate();
    } catch {
      // ignore
    }
    this.client = null;
    this.setStatus("DISCONNECTED");
  }
}

// Singleton WS Client
export const wsClient = new FlashSaleWebSocketClient();

export default wsClient;
