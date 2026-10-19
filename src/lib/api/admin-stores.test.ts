import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAdminStores } from "./admin";

describe("getAdminStores", () => {
  const ORIGINAL_USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_USE_MOCKS;
  });

  afterEach(() => {
    if (ORIGINAL_USE_MOCKS === undefined) {
      delete process.env.NEXT_PUBLIC_USE_MOCKS;
    } else {
      process.env.NEXT_PUBLIC_USE_MOCKS = ORIGINAL_USE_MOCKS;
    }
    vi.restoreAllMocks();
  });

  it("trả về mảng rỗng khi backend trả về items: [] (code 200, không fallback mock)", async () => {
    const mockBackendResponse = {
      success: true,
      code: 200,
      message: "Lấy danh sách gian hàng thành công",
      data: {
        items: [],
        pageNumber: 0,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
        first: true,
        last: true,
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockBackendResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const stores = await getAdminStores("BANNED");
    expect(stores).toEqual([]);
  });

  it("chuyển đổi đúng dữ liệu từ backend trả về", async () => {
    const mockBackendResponse = {
      success: true,
      code: 200,
      data: {
        items: [
          {
            id: 101,
            storeName: "Shop Demo",
            legalName: "Công ty Demo",
            ownerFullName: "Nguyễn Văn A",
            ownerEmail: "a@demo.vn",
            phone: "0912345678",
            status: "APPROVED",
            productsCount: 15,
            ordersCount: 42,
            ratingAvg: 4.8,
            createdAt: "2026-01-01T00:00:00Z",
            avatarUrl: "https://example.com/avatar.png",
            description: "Hà Nội",
          },
        ],
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockBackendResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const stores = await getAdminStores("APPROVED");
    expect(stores).toHaveLength(1);
    expect(stores[0].id).toBe(101);
    expect(stores[0].name).toBe("Shop Demo");
    expect(stores[0].ownerName).toBe("Nguyễn Văn A");
  });
});
