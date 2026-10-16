import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import viMessages from '@/../messages/vi.json';
import OAuth2RedirectPage from './page';

// --- Mocks ---
// 1) Next.js navigation: useSearchParams
const mockSearchParamsGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsGet(key),
  }),
}));

// 2) loginWithGoogle
const mockLoginWithGoogle = vi.fn();
vi.mock('@/features/auth/google-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/google-api')>();
  return {
    ...actual,
    loginWithGoogle: (...args: unknown[]) =>
      (mockLoginWithGoogle as (...a: unknown[]) => unknown)(...args),
  };
});

// 3) sessionStorage (override trực tiếp window.sessionStorage thay vì spy prototype,
// để cleanup deterministic giữa các test)
const mockSessionStorageGet = vi.fn();
const mockSessionStorageRemove = vi.fn();
const fakeSessionStorage = {
  getItem: mockSessionStorageGet as unknown as Storage['getItem'],
  setItem: vi.fn() as unknown as Storage['setItem'],
  removeItem: mockSessionStorageRemove as unknown as Storage['removeItem'],
  clear: vi.fn() as unknown as Storage['clear'],
  key: vi.fn() as unknown as Storage['key'],
  get length() {
    return 0;
  },
};

// 4) window.opener.postMessage + window.close
const mockPostMessage = vi.fn();
const mockWindowClose = vi.fn();

let originalOpener: Window['opener'];
let originalClose: typeof window.close;
let originalSessionStorage: Storage;

beforeEach(() => {
  mockSearchParamsGet.mockReset();
  mockLoginWithGoogle.mockReset();
  mockSessionStorageGet.mockReset();
  mockSessionStorageRemove.mockReset();
  mockPostMessage.mockReset();
  mockWindowClose.mockReset();

  // Default: no code, no error
  mockSearchParamsGet.mockReturnValue(null);
  mockSessionStorageGet.mockReturnValue('http://localhost:3000/oauth2/redirect');

  // Lưu + stub window.opener, window.close, window.sessionStorage
  originalOpener = window.opener;
  originalClose = window.close;
  originalSessionStorage = window.sessionStorage;
  Object.defineProperty(window, 'opener', {
    value: { postMessage: mockPostMessage },
    writable: true,
    configurable: true,
  });
  window.close = mockWindowClose;
  Object.defineProperty(window, 'sessionStorage', {
    value: fakeSessionStorage,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  // Restore everything we stubbed ở beforeEach
  Object.defineProperty(window, 'opener', {
    value: originalOpener,
    writable: true,
    configurable: true,
  });
  window.close = originalClose;
  Object.defineProperty(window, 'sessionStorage', {
    value: originalSessionStorage,
    writable: true,
    configurable: true,
  });
});

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  let result: ReturnType<typeof render> | null = null;
  act(() => {
    result = render(
      <QueryClientProvider client={qc}>
        <NextIntlClientProvider locale="vi" messages={viMessages}>
          <OAuth2RedirectPage />
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  });
  // Flush initial state + useEffect scheduling
  return result!;
}

describe('OAuth2RedirectPage', () => {
  it('renders loading state initially', async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'code' ? 'AUTH_CODE_XYZ' : null
    );
    renderPage();
    // Đợi effect chạy xong để DOM cập nhật
    await waitFor(() => {
      expect(
        screen.getByText(/đang hoàn tất đăng nhập|hoàn tất|pleaseWait/i)
      ).toBeInTheDocument();
    });
  });

  it('reads code from search params and calls loginWithGoogle with redirectUri from sessionStorage', async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'code' ? 'AUTH_CODE_XYZ' : null
    );
    mockSessionStorageGet.mockReturnValue('http://localhost:3000/oauth2/redirect');
    mockLoginWithGoogle.mockResolvedValue({
      accessToken: 'eyJhbGciOiJIUzI1NiJ9.test',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 1,
        email: 'a@gmail.com',
        fullName: 'A',
        phone: null,
        avatarUrl: null,
        status: 'ACTIVE',
        createdAt: '2026-10-16T10:00:00.000Z',
        roles: ['ROLE_BUYER'],
      },
      roles: ['ROLE_BUYER'],
    });

    renderPage();

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith({
        code: 'AUTH_CODE_XYZ',
        redirectUri: 'http://localhost:3000/oauth2/redirect',
      });
    });
  });

  it('on success: postMessage về parent với code, gọi window.close, remove sessionStorage', async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'code' ? 'AUTH_CODE_XYZ' : null
    );
    mockLoginWithGoogle.mockResolvedValue({
      accessToken: 'eyJ.eyJ.test',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 1,
        email: 'a@gmail.com',
        fullName: 'A',
        phone: null,
        avatarUrl: null,
        status: 'ACTIVE',
        createdAt: '2026-10-16T10:00:00.000Z',
        roles: ['ROLE_BUYER'],
      },
      roles: ['ROLE_BUYER'],
    });

    renderPage();

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'google-oauth-callback', code: 'AUTH_CODE_XYZ' },
        window.location.origin
      );
    });
    expect(mockSessionStorageRemove).toHaveBeenCalledWith(
      'google_oauth_redirect_uri'
    );

    // Wait for setTimeout(window.close, 200) with real time
    await new Promise((r) => setTimeout(r, 250));
    expect(mockWindowClose).toHaveBeenCalled();
  });

  it('on error param từ Google: postMessage error, KHÔNG gọi loginWithGoogle', async () => {
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'error') return 'access_denied';
      if (key === 'error_description') return 'User denied access';
      return null;
    });

    renderPage();

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'google-oauth-callback', error: 'User denied access' },
        window.location.origin
      );
    });
    expect(mockLoginWithGoogle).not.toHaveBeenCalled();

    // Wait 1500ms+ for window.close
    await new Promise((r) => setTimeout(r, 1600));
    expect(mockWindowClose).toHaveBeenCalled();
  });

  it('on missing code: postMessage error "không nhận được code"', async () => {
    mockSearchParamsGet.mockReturnValue(null); // no code, no error

    renderPage();

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'google-oauth-callback',
          error: expect.stringMatching(/không nhận được authorization code/i),
        }),
        window.location.origin
      );
    });
    expect(mockLoginWithGoogle).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 1600));
    expect(mockWindowClose).toHaveBeenCalled();
  });

  it('on loginWithGoogle throw: postMessage error, hiển thị error UI', async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'code' ? 'AUTH_CODE_XYZ' : null
    );
    mockLoginWithGoogle.mockRejectedValue(new Error('AUTH_502_GOOGLE_EXCHANGE'));

    renderPage();

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'google-oauth-callback',
          error: 'AUTH_502_GOOGLE_EXCHANGE',
        }),
        window.location.origin
      );
    });
    // Error UI renders
    await waitFor(() => {
      expect(
        screen.getByText(/đăng nhập thất bại|thất bại|error/i)
      ).toBeInTheDocument();
    });

    await new Promise((r) => setTimeout(r, 1600));
    expect(mockWindowClose).toHaveBeenCalled();
  });

  it('gọi applyAuthResponse (lưu accessToken + refreshToken) trước khi postMessage', async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'code' ? 'AUTH_CODE_XYZ' : null
    );
    mockLoginWithGoogle.mockResolvedValue({
      accessToken: 'eyJ.eyJ.test.access',
      refreshToken: 'refresh-must-be-saved',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 1,
        email: 'a@gmail.com',
        fullName: 'A',
        phone: null,
        avatarUrl: null,
        status: 'ACTIVE',
        createdAt: '2026-10-16T10:00:00.000Z',
        roles: ['ROLE_BUYER'],
      },
      roles: ['ROLE_BUYER'],
    });

    renderPage();

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalled();
    });
    // removeItem chỉ được gọi sau khi applyAuthResponse chạy thành công
    expect(mockSessionStorageRemove).toHaveBeenCalledWith(
      'google_oauth_redirect_uri'
    );
  });
});
