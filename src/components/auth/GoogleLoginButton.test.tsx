import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GoogleLoginButton } from './GoogleLoginButton';
import { TestWrapper } from '@/__tests__/test-wrapper';

// Mock sonner to capture toast calls
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useGoogleRedirect (NOT useGoogleLogin — popup flow bị xoá)
const mockRedirect = vi.fn();
const mockReset = vi.fn();
let mockStatus: 'idle' | 'redirecting' | 'error' = 'idle';
let mockError: Error | null = null;

vi.mock('@/features/auth/useGoogleRedirect', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/auth/useGoogleRedirect')>();
  return {
    ...actual,
    useGoogleRedirect: (options?: {
      onSuccess?: (state: string) => void;
      onError?: (err: Error) => void;
    }) => {
      (mockRedirect as unknown as { options?: typeof options }).options = options;
      return {
        redirect: mockRedirect,
        status: mockStatus,
        error: mockError,
        reset: mockReset,
      };
    },
  };
});

beforeEach(() => {
  mockRedirect.mockReset();
  mockReset.mockReset();
  toastError.mockReset();
  mockStatus = 'idle';
  mockError = null;
  // Reset sessionStorage (effect reads window.location.search on mount)
  if (typeof window !== 'undefined') {
    window.sessionStorage.clear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, search: '' },
    });
  }
});

describe('GoogleLoginButton (useGoogleRedirect flow)', () => {
  it('renders a Google icon-only button with correct aria-label', () => {
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>,
    );
    const btn = screen.getByRole('button', { name: /đăng nhập bằng google/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('h-10');
  });

  it('renders Google logo svg when idle', () => {
    const { container } = render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>,
    );
    const svg = container.querySelector('button svg');
    expect(svg).toBeInTheDocument();
  });

  it('calls useGoogleRedirect.redirect() on click (no popup)', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>,
    );
    await user.click(
      screen.getByRole('button', { name: /đăng nhập bằng google/i }),
    );
    expect(mockRedirect).toHaveBeenCalledTimes(1);
  });

  it('disables button when status is redirecting', () => {
    mockStatus = 'redirecting';
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>,
    );
    const btn = screen.getByRole('button', { name: /đăng nhập bằng google/i });
    expect(btn).toBeDisabled();
  });

  it('shows loading spinner when status is redirecting', () => {
    mockStatus = 'redirecting';
    const { container } = render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>,
    );
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows aria-busy=true when status is redirecting', () => {
    mockStatus = 'redirecting';
    const { container } = render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>,
    );
    const btn = container.querySelector('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('passes onSuccess callback to useGoogleRedirect', () => {
    const onSuccess = vi.fn();
    render(
      <TestWrapper>
        <GoogleLoginButton onSuccess={onSuccess} />
      </TestWrapper>,
    );
    expect(
      (mockRedirect as unknown as { options?: { onSuccess?: unknown } }).options
        ?.onSuccess,
    ).toBe(onSuccess);
  });

  it('passes onError callback to useGoogleRedirect', () => {
    const onError = vi.fn();
    render(
      <TestWrapper>
        <GoogleLoginButton onError={onError} />
      </TestWrapper>,
    );
    expect(
      (mockRedirect as unknown as { options?: { onError?: unknown } }).options
        ?.onError,
    ).toBe(onError);
  });

  it('shows error toast when useGoogleRedirect error is set (status=error)', async () => {
    mockStatus = 'error';
    mockError = new Error('AUTH_500_GOOGLE_CONFIG');
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>,
    );
    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
  });

  it('invokes onError prop when useGoogleRedirect calls its onError callback', () => {
    const onError = vi.fn();
    render(
      <TestWrapper>
        <GoogleLoginButton onError={onError} />
      </TestWrapper>,
    );
    const hookOnError = (
      mockRedirect as unknown as { options?: { onError?: (e: Error) => void } }
    ).options?.onError;
    expect(hookOnError).toBeDefined();
    hookOnError?.(new Error('boom'));
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('invokes onSuccess prop when useGoogleRedirect calls its onSuccess callback', () => {
    const onSuccess = vi.fn();
    render(
      <TestWrapper>
        <GoogleLoginButton onSuccess={onSuccess} />
      </TestWrapper>,
    );
    const hookOnSuccess = (
      mockRedirect as unknown as {
        options?: { onSuccess?: (s: string) => void };
      }
    ).options?.onSuccess;
    expect(hookOnSuccess).toBeDefined();
    hookOnSuccess?.('MOCK_STATE');
    expect(onSuccess).toHaveBeenCalledWith('MOCK_STATE');
  });

  it('toast message is i18n-translated (not raw error code)', async () => {
    mockStatus = 'error';
    mockError = new Error('AUTH_500_GOOGLE_CONFIG');
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>,
    );
    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
    const lastCall = toastError.mock.calls[toastError.mock.calls.length - 1];
    // Message phải là bản dịch tiếng Việt, KHÔNG phải raw error code
    expect(lastCall[0]).not.toBe('AUTH_500_GOOGLE_CONFIG');
    // i18n key googleLoginFailed trong vi
    expect(String(lastCall[0])).toMatch(/thất bại|không thành công|thử lại/i);
  });

  // ── post_login_redirect preservation ──────────────────────────────
  // Flow: user vào /login?redirect=/cart → bấm Google → sau khi Google trả
  // /auth/google/callback?code=... → callback page đọc sessionStorage
  // "post_login_redirect" để redirect về /cart (không phải /).
  describe('post_login_redirect preservation', () => {
    it('lưu ?redirect= vào sessionStorage khi user click Google', async () => {
      const user = userEvent.setup();
      const sessionStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        writable: true,
        value: sessionStorageMock,
      });
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { ...window.location, search: '?redirect=/cart' },
      });

      render(
        <TestWrapper>
          <GoogleLoginButton />
        </TestWrapper>
      );
      await user.click(
        screen.getByRole('button', { name: /đăng nhập bằng google/i }),
      );

      // setItem phải được gọi với "post_login_redirect" = "/cart"
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'post_login_redirect',
        '/cart',
      );
    });

    it('KHÔNG lưu sessionStorage khi URL không có ?redirect=', async () => {
      const user = userEvent.setup();
      const sessionStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        writable: true,
        value: sessionStorageMock,
      });
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { ...window.location, search: '' },
      });

      render(
        <TestWrapper>
          <GoogleLoginButton />
        </TestWrapper>
      );
      await user.click(
        screen.getByRole('button', { name: /đăng nhập bằng google/i }),
      );

      const calls = sessionStorageMock.setItem.mock.calls;
      const postLoginCalls = calls.filter(
        ([key]) => key === 'post_login_redirect',
      );
      expect(postLoginCalls).toHaveLength(0);
    });

    it('sanitize redirect path: KHÔNG lưu protocol-relative URL (//evil.com)', async () => {
      const user = userEvent.setup();
      const sessionStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        writable: true,
        value: sessionStorageMock,
      });
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { ...window.location, search: '?redirect=//evil.com' },
      });

      render(
        <TestWrapper>
          <GoogleLoginButton />
        </TestWrapper>
      );
      await user.click(
        screen.getByRole('button', { name: /đăng nhập bằng google/i }),
      );

      const calls = sessionStorageMock.setItem.mock.calls;
      const postLoginCalls = calls.filter(
        ([key]) => key === 'post_login_redirect',
      );
      if (postLoginCalls.length > 0) {
        // Nếu lưu thì giá trị phải đã được sanitize (KHÔNG phải "//evil.com")
        expect(postLoginCalls[0][1]).not.toBe('//evil.com');
      }
    });
  });
});
