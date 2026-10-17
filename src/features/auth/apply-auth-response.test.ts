/**
 * Test applyAuthResponse – logic dùng chung cho mọi flow đăng nhập.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { applyAuthResponse, toAuthUser } from "./apply-auth-response";
import type { AuthResponse, UserResponse } from "./api";

vi.mock("@/lib/api", () => ({
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
}));

import { setAccessToken, setRefreshToken } from "@/lib/api";

const mockUser: UserResponse = {
  id: 42,
  email: "test@example.com",
  fullName: "Test User",
  phone: "0901234567",
  avatarUrl: "https://example.com/avatar.png",
  status: "ACTIVE",
  createdAt: "2026-10-16T10:00:00.000Z",
};

const mockAuthResponse: AuthResponse = {
  accessToken:
    // header.payload.signature – payload chứa authorities ROLE_BUYER
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9CVVlFUiJdfQ.signature",
  refreshToken: "refresh-token-123",
  tokenType: "Bearer",
  expiresIn: 3600,
  user: mockUser,
};

describe("applyAuthResponse", () => {
  let qc: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("lưu accessToken vào localStorage/cookie", async () => {
    const setUser = vi.fn();
    await applyAuthResponse(mockAuthResponse, qc, setUser);
    expect(setAccessToken).toHaveBeenCalledWith(mockAuthResponse.accessToken);
  });

  it("lưu refreshToken vào sessionStorage", async () => {
    const setUser = vi.fn();
    await applyAuthResponse(mockAuthResponse, qc, setUser);
    expect(setRefreshToken).toHaveBeenCalledWith(mockAuthResponse.refreshToken);
  });

  it("set user qua setUser callback với role decode từ JWT", async () => {
    const setUser = vi.fn();
    await applyAuthResponse(mockAuthResponse, qc, setUser);
    expect(setUser).toHaveBeenCalledTimes(1);
    const user = setUser.mock.calls[0][0];
    expect(user.email).toBe("test@example.com");
    expect(user.role).toBe("BUYER"); // decoded from authorities
    expect(user.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("invalidate 4 query keys sau khi login", async () => {
    const setUser = vi.fn();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    await applyAuthResponse(mockAuthResponse, qc, setUser);
    expect(invalidateSpy).toHaveBeenCalledTimes(4);
    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        ["auth", "me"],
        ["cart"],
        ["vouchers", "mine"],
        ["products", "recommended"],
      ])
    );
  });

  it("trả về AuthUser cho component caller dùng", async () => {
    const setUser = vi.fn();
    const user = await applyAuthResponse(mockAuthResponse, qc, setUser);
    expect(user.email).toBe("test@example.com");
    expect(user.role).toBe("BUYER");
  });
});

describe("toAuthUser", () => {
  it("map UserResponse + JWT → AuthUser", () => {
    const u = toAuthUser(mockUser, mockAuthResponse.accessToken);
    expect(u.id).toBe("42");
    expect(u.email).toBe("test@example.com");
    expect(u.fullName).toBe("Test User");
    expect(u.role).toBe("BUYER");
    expect(u.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("không set avatarUrl khi backend trả null", () => {
    const u = toAuthUser(
      { ...mockUser, avatarUrl: null },
      mockAuthResponse.accessToken
    );
    expect(u.avatarUrl).toBeUndefined();
  });
});
