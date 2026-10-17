# Hướng Dẫn FE Tích Hợp Đăng Nhập Bằng Google (OAuth2 Authorization Code Flow)

> **Phiên bản**: 1.0
> **Ngày**: 2026-10-16
> **Backend**: `flash-sale-b2c-UTC2` (Spring Boot, OAuth2 Resource Server)
> **Frontend**: `flash-sale-b2c-fe` (Next.js 16, React 19, TypeScript)
> **Flow**: Authorization Code (an toàn hơn Implicit flow - server-side verify id_token bằng Google JWKS)
> **UI Style**: Popup flow (UX mượt nhất, không rời trang)

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Cấu hình Google Cloud Console](#2-cấu-hình-google-cloud-console)
3. [2 API endpoint BE cung cấp](#3-2-api-endpoint-be-cung-cấp)
4. [Cài đặt package](#4-cài-đặt-package)
5. [TypeScript types & API client](#5-typescript-types--api-client)
6. [Google OAuth hook (`useGoogleLogin`)](#6-google-oauth-hook-usegooglelogin)
7. [Component `GoogleLoginButton`](#7-component-googleloginbutton)
8. [Tích hợp vào trang login/register](#8-tích-hợp-vào-trang-loginregister)
9. [i18n message mapping](#9-i18n-message-mapping)
10. [Zustand auth store integration](#10-zustand-auth-store-integration)
11. [Error handling & retry strategy](#11-error-handling--retry-strategy)
12. [Test (TDD)](#12-test-tdd)
13. [Security checklist](#13-security-checklist)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Tổng quan

### 1.1 Flow tổng thể

```
[BROWSER]                       [FRONTEND]                     [BACKEND]                          [GOOGLE]
  |                                  |                              |                                  |
  | 1. Click "Đăng nhập Google"      |                              |                                  |
  |--------------------------------->|                              |                                  |
  |                                  | 2. GET /api/v1/auth/google/url                                  |
  |                                  |----------------------------->|                                  |
  |                                  |    { authorizationUrl }      |                                  |
  |                                  |<-----------------------------|                                  |
  |                                  | 3. window.open(authorizationUrl)                                |
  |                                  |--------------------------------------------------------> |
  |                                  |                              |                                  |
  |                                  |                              |  4. User chọn tài khoản Google    |
  |                                  |                              |<---------------------------------|
  |                                  | 5. Popup redirect về /oauth2/redirect?code=XYZ                |
  |                                  |<--------------------------------------------------------|
  |                                  | 6. POST /api/v1/auth/google {code, redirectUri}              |
  |                                  |----------------------------->|                                  |
  |                                  |                              | 7. Đổi code -> id_token          |
  |                                  |                              |--------------------------------->|
  |                                  |                              | 8. Verify id_token (JWKS)        |
  |                                  |                              | 9. Upsert User + AuthAccount     |
  |                                  |                              | 10. Generate JWT (access+refresh)|
  |                                  | 11. {accessToken, user, ...} |                                  |
  |                                  |<-----------------------------|                                  |
  | 12. Lưu token + redirect        |                              |                                  |
  |<---------------------------------|                              |                                  |
```

### 1.2 Tại sao Authorization Code flow (không phải Implicit)?

| Đặc tính | Authorization Code (flow này) | Implicit (cũ) |
|---|---|---|
| `client_secret` | Có (BE giữ, FE không thấy) | Không |
| `id_token` verify | Server verify bằng Google JWKS | FE verify bằng Google SDK |
| Token trong URL | Không (FE nhận `code` rồi đổi) | Có (token trong fragment) |
| Refresh token | Có | Không |
| Phù hợp SPA | Có (qua popup + BE exchange) | Legacy |

### 1.3 Cách thức popup flow hoạt động

- FE mở `window.open('/oauth2/google/redirect', 'google-oauth', 'width=500,height=600')`
- Google consent screen hiển thị trong popup
- User chọn tài khoản -> Google redirect về `/oauth2/redirect?code=AUTH_CODE&state=...`
- Trang callback đọc `code` từ URL, gọi `POST /api/v1/auth/google`, lưu token, đóng popup
- Trang chính (parent) detect popup đóng qua `window.opener.postMessage(...)` hoặc polling `popup.closed`

---

## 2. Cấu hình Google Cloud Console

### 2.1 Tạo OAuth 2.0 Client ID

1. Vào [Google Cloud Console](https://console.cloud.google.com/) -> chọn project (hoặc tạo mới)
2. **APIs & Services** -> **OAuth consent screen**:
   - User type: **External** (cho production) hoặc **Internal** (chỉ trong workspace)
   - App name: `Flash Sale B2C`
   - Support email: email của bạn
   - Scopes: chỉ cần `openid`, `email`, `profile` (BE yêu cầu)
   - **Test users** (nếu chọn External + chưa verify): thêm email Google sẽ dùng để test
3. **APIs & Services** -> **Credentials** -> **Create Credentials** -> **OAuth client ID**:
   - Application type: **Web application**
   - Name: `Flash Sale B2C - Web`
   - **Authorized JavaScript origins** (quan trọng cho popup flow):
     ```
     http://localhost:3000
     http://localhost:3001
     http://127.0.0.1:3000
     https://vibe-mart-utc2.canluaz.io.vn
     ```
   - **Authorized redirect URIs** (phải match chính xác):
     ```
     http://localhost:3000/oauth2/redirect
     https://vibe-mart-utc2.canluaz.io.vn/oauth2/redirect
     ```
4. Lưu lại **Client ID** và **Client Secret** -> gửi cho BE team để điền vào biến môi trường.

### 2.2 Biến môi trường BE (do BE team set, KHÔNG phải FE)

```bash
# File: .env (trên server BACKEND — KHÔNG phải .env của FE)
# Lưu ý bảo mật: KHÔNG commit giá trị thật của Client ID / Client Secret vào git.
# - Lấy giá trị từ Google Cloud Console -> APIs & Services -> Credentials
#   -> OAuth 2.0 Client IDs -> chọn client -> "Client ID" / "Client secret".
# - Gửi giá trị thật cho BE team qua kênh bảo mật (1Password / vault), KHÔNG qua chat/email.
# - BE đặt vào .env của Spring Boot (application-local.yml khi dev, .env trên VPS khi prod).
GOOGLE_OAUTH2_CLIENT_ID=<set-by-be-team>      # ví dụ: 1234567890-xxx.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=<set-by-be-team>  # ví dụ: GOCSPX-xxxxxxxxxxxxxxxxx
GOOGLE_OAUTH2_REDIRECT_URI=https://vibe-mart-utc2.canluaz.io.vn/oauth2/redirect
```

> **Lưu ý**: `GOOGLE_OAUTH2_REDIRECT_URI` ở BE phải **khớp chính xác** với redirect URI trong Google Console và với `redirectUri` mà FE gửi lên `POST /api/v1/auth/google`.
---

## 3. 2 API endpoint BE cung cấp

### 3.1 `GET /api/v1/auth/google/url`

**Auth**: Public (không cần token).

**Response** (wrap trong `ApiResponse<T>`):

```json
{
  "success": true,
  "code": 200,
  "message": "Lấy Google consent URL thành công",
  "data": {
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=https%3A%2F%2Fvibe-mart-utc2.canluaz.io.vn%2Foauth2%2Fredirect&response_type=code&scope=openid+email+profile&access_type=offline&prompt=consent",
    "state": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  },
  "timestamp": "2026-10-16T10:00:00.000Z"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `data.authorizationUrl` | string | URL đầy đủ để mở popup Google consent. **FE dùng luôn URL này**, không cần tự build. |
| `data.state` | string | UUID random. **FE tự tạo thêm** nếu muốn CSRF protection (xem mục 13). |

> **Lưu ý**: `redirect_uri` trong URL này là giá trị mà BE đã cấu hình (`GOOGLE_OAUTH2_REDIRECT_URI`). Nếu muốn dùng `redirect_uri` khác (vd test local), FE phải tự build URL — xem mục 3.3.

### 3.2 `POST /api/v1/auth/google`

**Auth**: Public.

**Request body**:

```json
{
  "code": "4/0AQlEd8xCjY...",
  "redirectUri": "https://vibe-mart-utc2.canluaz.io.vn/oauth2/redirect"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `code` | string | Có | `@NotBlank` - không được rỗng |
| `redirectUri` | string | Có | `@NotBlank` - phải khớp với redirect URI đã đăng ký với Google |

**Response success (200 OK)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Đăng nhập bằng Google thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "id": 123,
      "email": "buyer@gmail.com",
      "fullName": "Nguyen Van A",
      "phone": null,
      "avatarUrl": "https://lh3.googleusercontent.com/a/...",
      "status": "ACTIVE",
      "createdAt": "2026-10-16T10:00:00.000Z",
      "roles": ["ROLE_BUYER"]
    },
    "roles": ["ROLE_BUYER"]
  },
  "timestamp": "2026-10-16T10:00:00.000Z"
}
```

> **Cùng cấu trúc `AuthResponse` với email/password login** → FE có thể dùng chung logic lưu token + redirect.

### 3.3 Error codes (từ `AuthErrorCode.java`)

| HTTP | Code | Message (VI) | Nguyên nhân | Xử lý FE |
|---|---|---|---|---|
| 400 | (validation) | Thiếu code/redirectUri | Validation fail | Disable button, show form error |
| 502 | `AUTH_502_GOOGLE_EXCHANGE` | Không thể trao đổi authorization code với Google | Google token endpoint lỗi / network / `client_secret` sai | Toast lỗi, yêu cầu thử lại |
| 401 | `AUTH_401_GOOGLE_TOKEN` | Google ID token không hợp lệ hoặc đã hết hạn | id_token signature sai / expired / audience mismatch (sai `client_id`) | Toast lỗi, kiểm tra `GOOGLE_OAUTH2_CLIENT_ID` ở BE |
| 401 | `AUTH_401_GOOGLE_EMAIL_UNVERIFIED` | Email Google chưa được xác minh | User Google có email chưa verify | Yêu cầu user verify email trong Google account trước |
| 500 | `AUTH_500_GOOGLE_CONFIG` | Thiếu cấu hình Google OAuth2 trên server | BE chưa set `client_id` / `client_secret` / `redirect_uri` | Báo dev, lỗi hệ thống |

> Lưu ý: Error 400 do validation thường trả message tiếng Việt qua GlobalExceptionHandler, vd "Authorization code tu Google khong duoc de trong". FE map theo HTTP status hoặc `code` BE trả.

### 3.4 Sơ đồ tự build URL (nếu cần override `redirect_uri`)

Trong hầu hết trường hợp, FE **chỉ cần gọi `GET /api/v1/auth/google/url`** rồi redirect popup tới `authorizationUrl` trả về. Chỉ tự build khi cần test local với `redirect_uri` khác.

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=<CLIENT_ID>                   <- lấy từ env (public, không secret)
  &redirect_uri=<REDIRECT_URI>             <- URL encode
  &response_type=code
  &scope=openid+email+profile              <- URL encode space thành +
  &access_type=offline                     <- để có refresh_token (BE dùng)
  &prompt=consent                          <- luôn hiện consent (lần đầu + mỗi lần)
  &state=<random_uuid>                     <- CSRF protection (xem mục 13)
```

---

## 4. Cài đặt package

### 4.1 Bắt buộc

Với Authorization Code flow + popup, FE **không cần cài thêm package** nào. Dùng `window.open()` + `window.postMessage()` có sẵn của browser.

### 4.2 Tùy chọn (nếu muốn dùng Google Identity Services SDK)

```bash
npm install @types/google.accounts
```

> **Khuyến nghị cho project này**: KHÔNG dùng Google Identity Services SDK. Tự viết popup flow bằng `window.open()` để:
> - Bundle nhỏ hơn
> - Không phụ thuộc SDK Google (có thể breaking change)
> - Toàn quyền control UX (loading state, animation, error handling)

### 4.3 Packages đã có sẵn trong project

| Package | Version | Dùng cho |
|---|---|---|
| `react-hook-form` | 7.x | Form validation (nếu cần) |
| `zod` | 3.x | Schema validation |
| `next-intl` | 4.x+ | i18n messages |
| `zustand` | 5.x | Auth store (persist) |
| `@tanstack/react-query` | 5.x | API call + cache |
---

## 5. TypeScript types & API client

### 5.1 Types (`src/lib/api/auth/google-login.types.ts`)

```typescript
/**
 * Types cho Google OAuth2 login flow.
 * @see docs/fe-google-login-integration-guide.md
 */

/** Response từ GET /api/v1/auth/google/url */
export interface GoogleConsentUrlResponse {
  authorizationUrl: string;
  state?: string;
}

/** Request body cho POST /api/v1/auth/google */
export interface GoogleOAuth2LoginRequest {
  code: string;
  redirectUri: string;
}

/** Data trong ApiResponse.data khi đăng nhập Google thành công (giống email/password login) */
export interface GoogleAuthSuccessData {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds
  user: {
    id: number;
    email: string;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    createdAt: string; // ISO 8601
    roles: string[]; // vd: ["ROLE_BUYER"]
  };
  roles: string[];
}
```

### 5.2 API client (`src/lib/api/auth/google-login.api.ts`)

```typescript
import { apiFetch } from '@/lib/api/client';
import type {
  GoogleConsentUrlResponse,
  GoogleOAuth2LoginRequest,
  GoogleAuthSuccessData,
} from './google-login.types';

/**
 * Bước 1: Lấy Google consent URL.
 * BE tự build URL với client_id/redirect_uri đã cấu hình.
 * @throws ApiError khi BE config thiếu (500 AUTH_500_GOOGLE_CONFIG)
 */
export async function getGoogleConsentUrl(): Promise<GoogleConsentUrlResponse> {
  const response = await apiFetch<{
    success: boolean;
    code: number;
    message: string;
    data: GoogleConsentUrlResponse;
    timestamp: string;
  }>('/api/v1/auth/google/url', { method: 'GET' });

  return response.data;
}

/**
 * Bước 2: Đổi authorization code lấy JWT.
 * BE tự đổi code -> id_token, verify, upsert user, generate JWT.
 * @throws ApiError với code tương ứng (mục 3.3)
 */
export async function loginWithGoogle(
  payload: GoogleOAuth2LoginRequest,
): Promise<GoogleAuthSuccessData> {
  const response = await apiFetch<{
    success: boolean;
    code: number;
    message: string;
    data: GoogleAuthSuccessData;
    timestamp: string;
  }>('/api/v1/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.data;
}
```

### 5.3 Error class (đã có sẵn - `src/lib/api/errors.ts`)

```typescript
/**
 * BE trả về ApiResponse với success=false khi lỗi.
 * apiFetch tự parse và throw ApiError với code + message.
 */
export class ApiError extends Error {
  constructor(
    public code: string,        // vd: "AUTH_502_GOOGLE_EXCHANGE", "AUTH_401_GOOGLE_TOKEN"
    message: string,            // message tiếng Việt từ BE
    public status: number,      // HTTP status
    public details?: unknown,   // field-level errors nếu có
  ) {
    super(message);
  }
}
```

---

## 6. Google OAuth hook (`useGoogleLogin`)

### 6.1 File: `src/hooks/useGoogleLogin.ts`

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getGoogleConsentUrl,
  loginWithGoogle,
} from '@/lib/api/auth/google-login.api';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api/errors';

interface UseGoogleLoginOptions {
  /**
   * URL FE redirect về sau khi Google consent xong.
   * PHẢI khớp với Authorized redirect URI trong Google Cloud Console.
   * - Local:    'http://localhost:3000/oauth2/redirect'
   * - Staging:  'https://staging.example.com/oauth2/redirect'
   * - Prod:     'https://vibe-mart-utc2.canluaz.io.vn/oauth2/redirect'
   */
  redirectUri: string;

  /**
   * Callback khi đăng nhập thành công. FE thường redirect về trang chủ.
   * Nếu không truyền -> mặc định router.push('/').
   */
  onSuccess?: (user: { id: number; email: string; roles: string[] }) => void;

  /**
   * Callback khi có lỗi.
   */
  onError?: (error: Error) => void;
}

interface UseGoogleLoginReturn {
  /** Mở popup Google consent. */
  login: () => Promise<void>;

  /** Trạng thái hiện tại. */
  status: 'idle' | 'opening-popup' | 'authenticating' | 'error';

  /** Lỗi (nếu có). Reset khi gọi `login()` lần sau. */
  error: Error | null;

  /** Reset state về idle. */
  reset: () => void;
}

const POPUP_FEATURES = 'width=500,height=600,left=200,top=100,scrollbars=yes';

/**
 * Hook xử lý toàn bộ flow Google OAuth2 (Authorization Code + popup).
 *
 * Flow:
 * 1. Mở popup với Google consent URL (lấy từ BE).
 * 2. User chọn tài khoản Google -> Google redirect về /oauth2/redirect?code=...&state=...
 * 3. Trang callback đọc code, gọi POST /api/v1/auth/google, đóng popup + postMessage về parent.
 * 4. Hook nhận message, lưu token vào Zustand store, gọi onSuccess callback.
 *
 * @see docs/fe-google-login-integration-guide.md mục 1.3
 */
export function useGoogleLogin(
  options: UseGoogleLoginOptions,
): UseGoogleLoginReturn {
  const { redirectUri, onSuccess, onError } = options;
  const setAuth = useAuthStore((s) => s.setAuth);

  const [status, setStatus] = useState<UseGoogleLoginReturn['status']>('idle');
  const [error, setError] = useState<Error | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling khi unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  const login = useCallback(async () => {
    if (status !== 'idle' && status !== 'error') return;

    setStatus('opening-popup');
    setError(null);

    try {
      // Bước 1: Lấy consent URL từ BE
      const { authorizationUrl } = await getGoogleConsentUrl();

      // Bước 1.5: Lưu redirectUri vào sessionStorage để trang callback dùng
      sessionStorage.setItem('google_oauth_redirect_uri', redirectUri);

      // Bước 2: Mở popup Google consent
      const popup = window.open(authorizationUrl, 'google-oauth', POPUP_FEATURES);
      if (!popup) {
        throw new Error('Popup bị chặn. Vui lòng cho phép popup cho trang này.');
      }
      popupRef.current = popup;

      // Bước 3: Lắng nghe message từ popup (trang callback sẽ postMessage khi xử lý xong)
      const handleMessage = async (event: MessageEvent) => {
        // Chỉ nhận message từ chính origin của mình (security)
        if (event.origin !== window.location.origin) return;

        const data = event.data;
        if (!data || data.type !== 'google-oauth-callback') return;

        // Cleanup listener + polling
        window.removeEventListener('message', handleMessage);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }

        if (data.error) {
          const err = new Error(data.error);
          setError(err);
          setStatus('error');
          onError?.(err);
          return;
        }

        if (data.code) {
          try {
            setStatus('authenticating');

            // Bước 4: Đổi code lấy JWT
            const authData = await loginWithGoogle({
              code: data.code,
              redirectUri,
            });

            // Bước 5: Lưu token vào store
            setAuth({
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken,
              user: authData.user,
              roles: authData.roles,
            });

            // Cleanup sessionStorage
            sessionStorage.removeItem('google_oauth_redirect_uri');

            setStatus('idle');
            onSuccess?.(authData.user);
          } catch (err) {
            const apiErr =
              err instanceof ApiError
                ? err
                : new Error('Đăng nhập bằng Google thất bại');
            setError(apiErr);
            setStatus('error');
            onError?.(apiErr);
          }
        }
      };
      window.addEventListener('message', handleMessage);

      // Fallback: polling popup.closed (một số browser chặn postMessage)
      pollRef.current = setInterval(() => {
        if (popup.closed) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          window.removeEventListener('message', handleMessage);

          // Nếu popup đóng nhưng chưa có message -> user cancel
          if (status === 'opening-popup') {
            setStatus('idle');
          }
        }
      }, 500);
    } catch (err) {
      const apiErr =
        err instanceof ApiError ? err : new Error('Không thể bắt đầu đăng nhập Google');
      setError(apiErr);
      setStatus('error');
      onError?.(apiErr);
    }
  }, [status, redirectUri, setAuth, onSuccess, onError]);

  return { login, status, error, reset };
}
```
---

## 7. Component `GoogleLoginButton`

### 7.1 File: `src/components/auth/GoogleLoginButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useGoogleLogin } from '@/hooks/useGoogleLogin';
import { ApiError } from '@/lib/api/errors';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface GoogleLoginButtonProps {
  /** URL redirect về sau Google consent. Mặc định lấy từ env. */
  redirectUri?: string;

  /** Text hiển thị trên nút. */
  label?: string;

  /** Variant styling. */
  variant?: 'full' | 'icon-only';

  /** Disable button. */
  disabled?: boolean;
}

/**
 * Nút "Đăng nhập bằng Google" với popup flow.
 * Dùng cho cả trang login và register.
 */
export function GoogleLoginButton({
  redirectUri,
  label,
  variant = 'full',
  disabled = false,
}: GoogleLoginButtonProps) {
  const t = useTranslations('auth.google');
  const router = useRouter();
  const [showError, setShowError] = useState<string | null>(null);

  // Mặc định lấy từ NEXT_PUBLIC_SITE_URL + /oauth2/redirect
  const defaultRedirectUri =
    redirectUri ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/oauth2/redirect`;

  const { login, status, error } = useGoogleLogin({
    redirectUri: defaultRedirectUri,
    onSuccess: () => {
      // Redirect về trang chủ hoặc returnUrl nếu có
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      router.push(returnUrl ?? '/');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setShowError(t(`error.${err.code}`));
      } else {
        setShowError(t('error.UNKNOWN'));
      }
    },
  });

  const isLoading = status === 'opening-popup' || status === 'authenticating';
  const buttonText = label ?? t('button');

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => {
          setShowError(null);
          login();
        }}
        disabled={disabled || isLoading}
        aria-label={t('ariaLabel')}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        ) : (
          // Google "G" logo SVG (Google brand guidelines yêu cầu dùng chính logo này)
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}

        {variant === 'full' && <span>{isLoading ? t('loading') : buttonText}</span>}
      </button>

      {(showError ?? error) && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {showError ?? (error instanceof Error ? error.message : null)}
        </p>
      )}
    </div>
  );
}
```

---

## 8. Tích hợp vào trang login/register

### 8.1 Trang login (`src/app/(auth)/login/page.tsx`)

```typescript
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">Đăng nhập</h1>

      {/* Form đăng nhập email/password */}
      <LoginForm />

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-sm text-gray-500">hoặc</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Nút Google */}
      <GoogleLoginButton />

      <p className="mt-4 text-center text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <a href="/register" className="text-blue-600 hover:underline">
          Đăng ký
        </a>
      </p>
    </main>
  );
}
```

### 8.2 Trang register (`src/app/(auth)/register/page.tsx`)

```typescript
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">Đăng ký</h1>

      <RegisterForm />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-sm text-gray-500">hoặc</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleLoginButton />

      <p className="mt-4 text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          Đăng nhập
        </a>
      </p>
    </main>
  );
}
```

### 8.3 Trang callback popup (`src/app/oauth2/redirect/page.tsx`)

Trang này **BẮT BUỘC** — popup sẽ navigate về đây sau khi user consent xong. Trang này đọc `code` từ URL, gọi `POST /api/v1/auth/google`, đóng popup, postMessage về parent.

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginWithGoogle } from '@/lib/api/auth/google-login.api';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslations } from 'next-intl';

/**
 * Trang callback OAuth2 - chạy trong popup window.
 *
 * Flow:
 * 1. Google redirect về đây với ?code=AUTH_CODE&state=...
 * 2. Trang đọc code, gọi POST /api/v1/auth/google
 * 3. Lưu token vào store
 * 4. postMessage về parent window
 * 5. Đóng popup
 */
export default function OAuth2RedirectPage() {
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const t = useTranslations('auth.google');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Lấy redirectUri từ sessionStorage (đã lưu khi mở popup)
    const redirectUri = sessionStorage.getItem('google_oauth_redirect_uri') ?? '';

    if (errorParam) {
      // User cancel hoặc Google trả lỗi
      const msg = errorDescription || errorParam;
      window.opener?.postMessage(
        { type: 'google-oauth-callback', error: msg },
        window.location.origin,
      );
      setError(msg);
      setTimeout(() => window.close(), 1500);
      return;
    }

    if (!code) {
      const msg = 'Không nhận được authorization code từ Google';
      window.opener?.postMessage(
        { type: 'google-oauth-callback', error: msg },
        window.location.origin,
      );
      setError(msg);
      setTimeout(() => window.close(), 1500);
      return;
    }

    // Gọi BE đổi code lấy JWT
    loginWithGoogle({ code, redirectUri })
      .then((authData) => {
        setAuth({
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          user: authData.user,
          roles: authData.roles,
        });

        // Gửi message về parent window
        window.opener?.postMessage(
          { type: 'google-oauth-callback', code },
          window.location.origin,
        );

        // Đóng popup sau 200ms
        setTimeout(() => window.close(), 200);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : t('error.UNKNOWN');
        setError(msg);
        window.opener?.postMessage(
          { type: 'google-oauth-callback', error: msg },
          window.location.origin,
        );
        setTimeout(() => window.close(), 2000);
      });
  }, [searchParams, setAuth, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        {error ? (
          <>
            <div className="mb-4 text-red-600">!</div>
            <p className="text-lg font-semibold text-gray-900">
              {t('callback.error')}
            </p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <p className="mt-4 text-xs text-gray-500">{t('callback.closing')}</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-lg font-semibold text-gray-900">
              {t('callback.processing')}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {t('callback.pleaseWait')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```
---

## 9. i18n message mapping

### 9.1 `messages/vi.json` (thêm vào namespace `auth.google`)

```json
{
  "auth": {
    "google": {
      "button": "Đăng nhập bằng Google",
      "loading": "Đang xử lý...",
      "ariaLabel": "Đăng nhập bằng tài khoản Google",
      "callback": {
        "processing": "Đang hoàn tất đăng nhập",
        "pleaseWait": "Vui lòng đợi trong giây lát...",
        "error": "Đăng nhập thất bại",
        "closing": "Cửa sổ sẽ tự đóng sau vài giây"
      },
      "error": {
        "AUTH_502_GOOGLE_EXCHANGE": "Không thể kết nối với Google. Vui lòng thử lại.",
        "AUTH_401_GOOGLE_TOKEN": "Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.",
        "AUTH_401_GOOGLE_EMAIL_UNVERIFIED": "Email Google của bạn chưa được xác minh. Vui lòng kiểm tra trong tài khoản Google.",
        "AUTH_500_GOOGLE_CONFIG": "Đăng nhập bằng Google tạm thời không khả dụng. Vui lòng thử lại sau.",
        "POPUP_BLOCKED": "Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này.",
        "UNKNOWN": "Đăng nhập bằng Google thất bại. Vui lòng thử lại."
      }
    }
  }
}
```

### 9.2 `messages/en.json`

```json
{
  "auth": {
    "google": {
      "button": "Sign in with Google",
      "loading": "Processing...",
      "ariaLabel": "Sign in with your Google account",
      "callback": {
        "processing": "Completing sign in",
        "pleaseWait": "Please wait a moment...",
        "error": "Sign in failed",
        "closing": "This window will close in a few seconds"
      },
      "error": {
        "AUTH_502_GOOGLE_EXCHANGE": "Cannot connect to Google. Please try again.",
        "AUTH_401_GOOGLE_TOKEN": "Your Google session has expired. Please try again.",
        "AUTH_401_GOOGLE_EMAIL_UNVERIFIED": "Your Google email is not verified. Please verify it in your Google account.",
        "AUTH_500_GOOGLE_CONFIG": "Google sign-in is temporarily unavailable. Please try again later.",
        "POPUP_BLOCKED": "Your browser blocked the popup. Please allow popups for this site.",
        "UNKNOWN": "Google sign-in failed. Please try again."
      }
    }
  }
}
```

---

## 10. Zustand auth store integration

### 10.1 File: `src/stores/auth.store.ts` (giả định đã có sẵn)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  createdAt: string;
  roles: string[];
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  roles: string[];

  // Actions
  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    roles: string[];
  }) => void;
  clearAuth: () => void;
  setAccessToken: (token: string) => void; // cho refresh token flow
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      roles: [],

      setAuth: (data) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          roles: data.roles,
        }),

      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          roles: [],
        }),

      setAccessToken: (token) => set({ accessToken: token }),
    }),
    {
      name: 'fs_auth',
      // localStorage: persist token + user
    },
  ),
);
```

### 10.2 Helper lấy token (đã có trong project)

```typescript
// src/lib/api/client.ts
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken ?? localStorage.getItem('fs_access_token');
}
```

> **Lưu ý**: Google login dùng cùng `setAuth()` action -> token lưu vào cùng localStorage key `fs_auth` -> các API call sau dùng chung token. Không cần code riêng.

---

## 11. Error handling & retry strategy

### 11.1 Phân loại lỗi

| Lỗi | Code | Có retry? | Cách xử lý |
|---|---|---|---|
| Network error (timeout, offline) | - | Retry 1 lần | Tự động retry trong `apiFetch` |
| 502 `AUTH_502_GOOGLE_EXCHANGE` | Google token endpoint fail | Retry 1 lần sau 2s | Có thể do Google outage / network |
| 401 `AUTH_401_GOOGLE_TOKEN` | id_token invalid/expired | Không retry | Báo user thử lại (code chỉ dùng 1 lần) |
| 401 `AUTH_401_GOOGLE_EMAIL_UNVERIFIED` | Email Google chưa verify | Không retry | Hướng dẫn user verify email |
| 500 `AUTH_500_GOOGLE_CONFIG` | BE thiếu config | Không retry | Báo dev |
| Popup bị chặn | `POPUP_BLOCKED` | Không retry | Hướng dẫn user allow popup |
| User đóng popup | - | Không | Coi như user cancel -> reset về idle |

### 11.2 Retry logic (optional)

Thêm vào `useGoogleLogin` hook:

```typescript
const RETRYABLE_CODES = ['AUTH_502_GOOGLE_EXCHANGE'];

async function loginWithGoogleWithRetry(
  payload: GoogleOAuth2LoginRequest,
  attempt = 1,
): Promise<GoogleAuthSuccessData> {
  try {
    return await loginWithGoogle(payload);
  } catch (err) {
    if (
      err instanceof ApiError &&
      RETRYABLE_CODES.includes(err.code) &&
      attempt < 2
    ) {
      await new Promise((r) => setTimeout(r, 2000));
      return loginWithGoogleWithRetry(payload, attempt + 1);
    }
    throw err;
  }
}
```
---

## 12. Test (TDD)

### 12.1 Test hook `useGoogleLogin` (`src/hooks/useGoogleLogin.test.ts`)

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGoogleLogin } from './useGoogleLogin';
import { useAuthStore } from '@/stores/auth.store';

// Mock window.open
const mockPopup = {
  closed: false,
  close: vi.fn(),
  postMessage: vi.fn(),
};
global.window.open = vi.fn(() => mockPopup);

// Mock api
vi.mock('@/lib/api/auth/google-login.api', () => ({
  getGoogleConsentUrl: vi.fn(),
  loginWithGoogle: vi.fn(),
}));

import { getGoogleConsentUrl, loginWithGoogle } from '@/lib/api/auth/google-login.api';

describe('useGoogleLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, roles: [] });
  });

  it('mo popup khi goi login()', async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
    });

    const { result } = renderHook(() =>
      useGoogleLogin({ redirectUri: 'http://localhost:3000/oauth2/redirect' }),
    );

    await act(async () => {
      await result.current.login();
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('accounts.google.com'),
      'google-oauth',
      expect.any(String),
    );
    expect(result.current.status).toBe('opening-popup');
  });

  it('luu token khi nhan message thanh cong', async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: 'https://accounts.google.com/...',
    });
    vi.mocked(loginWithGoogle).mockResolvedValue({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 1,
        email: 'test@gmail.com',
        fullName: 'Test',
        phone: null,
        avatarUrl: null,
        status: 'ACTIVE',
        createdAt: '2026-10-16T00:00:00Z',
        roles: ['ROLE_BUYER'],
      },
      roles: ['ROLE_BUYER'],
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useGoogleLogin({
        redirectUri: 'http://localhost:3000/oauth2/redirect',
        onSuccess,
      }),
    );

    await act(async () => {
      await result.current.login();
    });

    // Gia lap popup postMessage ve parent
    await act(async () => {
      const event = new MessageEvent('message', {
        origin: window.location.origin,
        data: { type: 'google-oauth-callback', code: 'AUTH_CODE' },
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(loginWithGoogle).toHaveBeenCalledWith({
        code: 'AUTH_CODE',
        redirectUri: 'http://localhost:3000/oauth2/redirect',
      });
    });

    expect(useAuthStore.getState().accessToken).toBe('access-123');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('bao loi khi popup bi chan', async () => {
    (window.open as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useGoogleLogin({
        redirectUri: 'http://localhost:3000/oauth2/redirect',
        onError,
      }),
    );

    await act(async () => {
      await result.current.login();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error?.message).toMatch(/popup/i);
    });
    expect(onError).toHaveBeenCalled();
  });

  it('reset state khi goi reset()', async () => {
    const { result } = renderHook(() =>
      useGoogleLogin({ redirectUri: 'http://localhost:3000/oauth2/redirect' }),
    );

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });
});
```

### 12.2 Test API client (`src/lib/api/auth/google-login.api.test.ts`)

```typescript
import { getGoogleConsentUrl, loginWithGoogle } from './google-login.api';
import { apiFetch } from '@/lib/api/client';

vi.mock('@/lib/api/client');

describe('Google OAuth API', () => {
  describe('getGoogleConsentUrl', () => {
    it('tra ve authorizationUrl tu response', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        code: 200,
        message: 'OK',
        data: { authorizationUrl: 'https://accounts.google.com/...', state: 'uuid' },
        timestamp: '2026-10-16T00:00:00Z',
      });

      const result = await getGoogleConsentUrl();

      expect(result.authorizationUrl).toBe('https://accounts.google.com/...');
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/google/url', { method: 'GET' });
    });
  });

  describe('loginWithGoogle', () => {
    it('gui code + redirectUri len BE', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        success: true,
        code: 200,
        message: 'OK',
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {} as any,
          roles: ['ROLE_BUYER'],
        },
        timestamp: '2026-10-16T00:00:00Z',
      });

      await loginWithGoogle({ code: 'AUTH_CODE', redirectUri: 'http://localhost:3000/oauth2/redirect' });

      expect(apiFetch).toHaveBeenCalledWith('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'AUTH_CODE', redirectUri: 'http://localhost:3000/oauth2/redirect' }),
      });
    });

    it('throw ApiError khi BE tra loi', async () => {
      const { ApiError } = await import('@/lib/api/errors');
      vi.mocked(apiFetch).mockRejectedValue(
        new ApiError('AUTH_502_GOOGLE_EXCHANGE', 'Google fail', 502),
      );

      await expect(
        loginWithGoogle({ code: 'X', redirectUri: 'Y' }),
      ).rejects.toThrow(ApiError);
    });
  });
});
```

### 12.3 Test component `GoogleLoginButton` (`src/components/auth/GoogleLoginButton.test.tsx`)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleLoginButton } from './GoogleLoginButton';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('GoogleLoginButton', () => {
  it('render nut voi label tieng Viet', () => {
    render(<GoogleLoginButton />);
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
  });

  it('disable khi prop disabled=true', () => {
    render(<GoogleLoginButton disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('click button goi useGoogleLogin.login()', async () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalled();
    });
  });
});
```

---

## 13. Security checklist

### 13.1 CSRF Protection (state parameter)

Google OAuth2 spec khuyến nghị dùng `state` parameter để chống CSRF. Flow:

1. **Trước khi mở popup**: FE tạo `state = random UUID`, lưu vào `sessionStorage`
2. **Trong consent URL**: thêm `&state=<UUID>`
3. **Khi Google redirect về**: trang callback so sánh `state` từ URL với `state` trong sessionStorage
4. **Nếu khớp** -> tiếp tục xử lý. **Nếu khác** -> abort (có thể bị CSRF attack).

**Code trong `useGoogleLogin` hook** (thêm trước `window.open`):

```typescript
const state = crypto.randomUUID();
sessionStorage.setItem('google_oauth_state', state);

// Tự build URL thay vì dùng authorizationUrl từ BE (vì cần thêm state)
const url = new URL(authorizationUrl);
url.searchParams.set('state', state);
const finalUrl = url.toString();

const popup = window.open(finalUrl, 'google-oauth', POPUP_FEATURES);
```

**Code trong trang callback**:

```typescript
useEffect(() => {
  const stateFromUrl = searchParams.get('state');
  const stateFromStorage = sessionStorage.getItem('google_oauth_state');

  if (!stateFromUrl || stateFromUrl !== stateFromStorage) {
    setError('Invalid state parameter (possible CSRF attack)');
    return;
  }

  sessionStorage.removeItem('google_oauth_state');
  // ... tiếp tục xử lý code
}, [searchParams]);
```

> **Quan trọng**: Nếu dùng CSRF state, KHÔNG dùng `state` mà BE tự sinh trong response `getGoogleConsentUrl` — FE phải override.

### 13.2 Origin validation cho postMessage

```typescript
// ĐÚNG: chỉ nhận message từ chính origin của mình
if (event.origin !== window.location.origin) return;

// SAI: nhận message từ bất kỳ origin nào (lỗ hổng bảo mật)
if (event.data) { /* ... */ }
```

### 13.3 Không lộ client_secret

- `client_secret` **CHỈ BE biết** — lưu trong env var, KHÔNG commit vào repo, KHÔNG để vào FE bundle
- FE chỉ cần `client_id` (public) nếu tự build URL. Nhưng dùng `GET /api/v1/auth/google/url` của BE thì FE không cần biết `client_id` luôn.

### 13.4 Không lộ access_token ra console

- KHÔNG `console.log(accessToken)`
- KHÔNG lưu token vào cookie không `httpOnly` (FE chỉ dùng localStorage + Zustand persist)

### 13.5 HTTPS only (production)

- Production PHẢI dùng `https://` cho `redirect_uri` (Google từ chối HTTP redirect_uri trên OAuth client đã publish).
- Local dev có thể dùng `http://localhost:3000/...` (Google cho phép).

### 13.6 Rate limiting (phía BE)

- Nên có rate limit trên `POST /api/v1/auth/google` (vd: 10 req/min/IP) để chống brute force.
- Nếu chưa có, đề xuất thêm vào backlog.
---

## 14. Troubleshooting

### 14.1 Popup bị chặn

**Triệu chứng**: Click "Đăng nhập bằng Google" -> không có gì xảy ra hoặc toast "Popup bị chặn".

**Nguyên nhân**: Browser chặn popup do user chưa từng tương tác với trang, hoặc extension chặn popup.

**Giải pháp**:
- Hướng dẫn user allow popup cho domain.
- **Tạm thời** fallback sang redirect flow (`window.location.href = authorizationUrl`) — UX kém hơn nhưng luôn hoạt động.

### 14.2 `redirect_uri_mismatch`

**Triệu chứng**: Google consent screen báo lỗi "redirect_uri_mismatch".

**Nguyên nhân**: `redirectUri` FE gửi lên BE không khớp với **Authorized redirect URI** trong Google Cloud Console.

**Cách fix**:
1. Mở Google Cloud Console -> Credentials -> OAuth client ID của bạn
2. Thêm chính xác URL `redirect_uri` (kể cả protocol, domain, path, port)
3. Lưu -> đợi 5 phút để Google áp dụng
4. Test lại

### 14.3 BE trả 500 `AUTH_500_GOOGLE_CONFIG`

**Triệu chứng**: Toast "Đăng nhập bằng Google tạm thời không khả dụng".

**Nguyên nhân**: BE thiếu 1 trong 3 env var: `GOOGLE_OAUTH2_CLIENT_ID`, `GOOGLE_OAUTH2_CLIENT_SECRET`, `GOOGLE_OAUTH2_REDIRECT_URI`.

**Cách fix**:
- Báo dev kiểm tra `application-{profile}.yaml` hoặc `.env` trên VPS.

### 14.4 `id_token` expired ngay khi nhận

**Triệu chứng**: BE trả 401 `AUTH_401_GOOGLE_TOKEN` dù user vừa mới consent xong.

**Nguyên nhân hiếm**: Sai `issuer` config (mặc định `https://accounts.google.com` — đúng rồi). Hoặc clock skew giữa server và Google quá lớn (>5 phút).

**Cách fix**:
- Sync NTP trên VPS: `sudo timedatectl set-ntp true`.
- Verify `google.oauth2.issuer` trong `application-local.yaml` = `https://accounts.google.com`.

### 14.5 Popup mở nhưng trắng / không load

**Triệu chứng**: Popup mở nhưng trang trắng hoặc spinner mãi.

**Nguyên nhân**: Trang callback `/oauth2/redirect` bị lỗi, hoặc CSP chặn inline script.

**Cách fix**:
- Mở DevTools trong popup (phải chuột -> Inspect) -> check Console.
- Verify trang `/oauth2/redirect` đã được tạo đúng vị trí theo mục 8.3.
- Nếu dùng CSP `script-src 'self'`, đảm bảo không có inline script trong trang callback.

### 14.6 User đã có tài khoản local, đăng nhập Google lần đầu

**Triệu chứng**: User tạo tài khoản bằng email/password trước (vd: `buyer@gmail.com`), sau đó đăng nhập bằng Google với cùng email -> có 2 account riêng?

**Thực tế (xem `GoogleOAuth2ServiceImpl.upsertUserAndAuthAccount`)**:
- BE tìm theo `(provider, providerAccountId)` trước -> không có.
- Tìm theo `email` -> **merge**: link `AuthAccount(provider=GOOGLE)` vào `User` hiện tại.
- Kết quả: user có 1 account, đăng nhập được cả email/password và Google.

-> **FE không cần làm gì đặc biệt**. Tài khoản tự động merge.

### 14.7 Token bị expire trong khi user đang dùng

**Triệu chứng**: API call bị 401, user bị logout.

**Cách xử lý**: Dùng `refresh_token` (đã có trong `AuthResponse`) để gọi `POST /api/v1/auth/refresh-token`. Xem `.cursor/rules/auth-jwt.mdc` để biết flow refresh.

---

## Phụ lục A: Checklist trước khi deploy

```
□ 1. Đăng ký OAuth Client ID trên Google Cloud Console
□ 2. Thêm Authorized JavaScript origins: domain production
□ 3. Thêm Authorized redirect URIs: https://<domain>/oauth2/redirect
□ 4. BE set env GOOGLE_OAUTH2_CLIENT_ID/SECRET/REDIRECT_URI
□ 5. FE set NEXT_PUBLIC_SITE_URL=https://<domain> (để build redirectUri mặc định)
□ 6. CORS: thêm domain FE vào CORS_ALLOWED_ORIGINS của BE
□ 7. Tạo trang /oauth2/redirect (mục 8.3)
□ 8. Thêm GoogleLoginButton vào /login và /register
□ 9. Test trên staging với user Google thật
□ 10. Verify HTTPS có certificate hợp lệ
□ 11. Verify popup không bị browser chặn
□ 12. Verify error messages hiển thị đúng bằng tiếng Việt
□ 13. Test auto-link khi user có local account cùng email
□ 14. Test refresh token flow sau Google login
```

---

## Phụ lục B: Mapping code -> file thực tế

| File cần tạo | Mục | Mục đích |
|---|---|---|
| `src/lib/api/auth/google-login.types.ts` | 5.1 | TypeScript types |
| `src/lib/api/auth/google-login.api.ts` | 5.2 | API client |
| `src/lib/api/auth/google-login.api.test.ts` | 12.2 | Test API client |
| `src/hooks/useGoogleLogin.ts` | 6.1 | Hook xử lý popup flow |
| `src/hooks/useGoogleLogin.test.ts` | 12.1 | Test hook |
| `src/components/auth/GoogleLoginButton.tsx` | 7.1 | Component nút Google |
| `src/components/auth/GoogleLoginButton.test.tsx` | 12.3 | Test component |
| `src/app/oauth2/redirect/page.tsx` | 8.3 | Trang callback (trong popup) |
| `src/app/(auth)/login/page.tsx` | 8.1 | Tích hợp vào login |
| `src/app/(auth)/register/page.tsx` | 8.2 | Tích hợp vào register |
| `messages/vi.json` | 9.1 | i18n tiếng Việt |
| `messages/en.json` | 9.2 | i18n tiếng Anh |

---

## Phụ lục C: Liên hệ với các rule khác

| Rule | Áp dụng |
|---|---|
| `.cursor/rules/api-data.mdc` | Pattern fetch + ApiError |
| `.cursor/rules/auth-jwt.mdc` | Token storage + refresh flow |
| `.cursor/rules/i18n.mdc` | i18n messages (mục 9) |
| `.cursor/rules/error-handling.mdc` | Error handling pattern |
| `.cursor/rules/testing-required.mdc` | TDD bắt buộc (mục 12) |
| `.cursor/rules/component-pattern.mdc` | Cấu trúc component |
| `.cursor/rules/design-system.mdc` | Tailwind tokens (thay thế hard-coded `border-gray-300`) |

---

## Phụ lục D: Tham khảo

- [Google OAuth 2.0 - Authorization Code flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Identity Services](https://developers.google.com/identity/oauth2/web/guides/use-token-model) (không dùng, nhưng để tham khảo)
- Backend code: `auth/controller/AuthController.java`, `auth/service/GoogleOAuth2ServiceImpl.java`
- Backend docs: `auth/exception/AuthErrorCode.java` (mã lỗi)

---

**Người viết**: Cursor Assistant
**Reviewer**: (chờ user duyệt)
**Cập nhật lần cuối**: 2026-10-16