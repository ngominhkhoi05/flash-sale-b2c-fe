/**
 * Test mapGoogleErrorToI18nKey — pure mapper từ error code (sau khi
 * strip prefix `google_`) sang i18n key trong namespace `error`.
 *
 * Input: phần sau khi strip `google_` prefix từ URL `?error=google_<CODE>`.
 * - Hợp lệ: trả key `error.google_<normalized>` (lowercase).
 * - Không match: trả `error.google_unknown` (safe default).
 */
import { describe, it, expect } from "vitest";
import { mapGoogleErrorToI18nKey } from "./google-oauth-errors";

describe("mapGoogleErrorToI18nKey", () => {
  it("maps 'cancelled' → 'error.google_cancelled'", () => {
    expect(mapGoogleErrorToI18nKey("cancelled")).toBe("error.google_cancelled");
  });

  it("maps 'no_code' → 'error.google_no_code'", () => {
    expect(mapGoogleErrorToI18nKey("no_code")).toBe("error.google_no_code");
  });

  it("maps 'state_mismatch' → 'error.google_state_mismatch'", () => {
    expect(mapGoogleErrorToI18nKey("state_mismatch")).toBe(
      "error.google_state_mismatch",
    );
  });

  it("maps 'AUTH_401_GOOGLE_TOKEN' → 'error.google_auth_401_google_token'", () => {
    expect(mapGoogleErrorToI18nKey("AUTH_401_GOOGLE_TOKEN")).toBe(
      "error.google_auth_401_google_token",
    );
  });

  it("maps 'AUTH_502_GOOGLE_EXCHANGE' → 'error.google_auth_502_google_exchange'", () => {
    expect(mapGoogleErrorToI18nKey("AUTH_502_GOOGLE_EXCHANGE")).toBe(
      "error.google_auth_502_google_exchange",
    );
  });

  it("maps 'AUTH_500_GOOGLE_CONFIG' → 'error.google_auth_500_google_config'", () => {
    expect(mapGoogleErrorToI18nKey("AUTH_500_GOOGLE_CONFIG")).toBe(
      "error.google_auth_500_google_config",
    );
  });

  it("maps 'AUTH_401_GOOGLE_EMAIL_UNVERIFIED' → 'error.google_auth_401_google_email_unverified'", () => {
    expect(mapGoogleErrorToI18nKey("AUTH_401_GOOGLE_EMAIL_UNVERIFIED")).toBe(
      "error.google_auth_401_google_email_unverified",
    );
  });

  it("maps 'unknown' → 'error.google_unknown'", () => {
    expect(mapGoogleErrorToI18nKey("unknown")).toBe("error.google_unknown");
  });

  it("fallback về 'error.google_unknown' khi code không match", () => {
    expect(mapGoogleErrorToI18nKey("RANDOM_UNKNOWN_CODE")).toBe(
      "error.google_unknown",
    );
  });

  it("fallback về 'error.google_unknown' khi input rỗng", () => {
    expect(mapGoogleErrorToI18nKey("")).toBe("error.google_unknown");
  });

  it("fallback về 'error.google_unknown' khi input null/undefined", () => {
    expect(mapGoogleErrorToI18nKey(null)).toBe("error.google_unknown");
    expect(mapGoogleErrorToI18nKey(undefined)).toBe("error.google_unknown");
  });

  it("lowercase input vẫn map đúng", () => {
    expect(mapGoogleErrorToI18nKey("auth_502_google_exchange")).toBe(
      "error.google_auth_502_google_exchange",
    );
  });
});
