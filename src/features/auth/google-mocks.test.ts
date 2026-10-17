/**
 * Test Google OAuth2 mocks — verify shape match BE contract.
 */
import { describe, it, expect } from "vitest";
import {
  getGoogleConsentUrlMock,
  loginWithGoogleMock,
} from "./google-mocks";

describe("Google OAuth mocks", () => {
  describe("getGoogleConsentUrlMock", () => {
    it("trả về authorizationUrl trỏ về trang callback local", () => {
      const result = getGoogleConsentUrlMock();
      expect(result.authorizationUrl).toContain("/oauth2/redirect");
      expect(result.authorizationUrl).toContain("code=MOCK_AUTH_CODE");
      expect(result.authorizationUrl).toContain("state=MOCK_STATE");
    });

    it("trả về state để FE dùng cho CSRF check (nếu cần)", () => {
      const result = getGoogleConsentUrlMock();
      expect(result.state).toBe("MOCK_STATE");
    });
  });

  describe("loginWithGoogleMock", () => {
    it("trả về AuthResponse với user mock", () => {
      const result = loginWithGoogleMock({
        code: "AUTH_CODE",
        redirectUri: "https://example.com/oauth2/redirect",
      });
      expect(result.user.email).toBe("mock.google.user@gmail.com");
      expect(result.user.status).toBe("ACTIVE");
      expect(result.tokenType).toBe("Bearer");
      expect(result.expiresIn).toBe(3600);
    });
  });
});
