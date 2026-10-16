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

// Mock useGoogleLogin to control the hook output
const mockLogin = vi.fn();
const mockReset = vi.fn();
let mockStatus: 'idle' | 'opening-popup' | 'authenticating' | 'error' = 'idle';
let mockError: Error | null = null;

vi.mock('@/features/auth/useGoogleLogin', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/useGoogleLogin')>();
  return {
    ...actual,
    useGoogleLogin: (options?: {
      onSuccess?: (user: unknown) => void;
      onError?: (err: Error) => void;
    }) => {
      // Capture the callbacks for later invocation in tests
      (mockLogin as unknown as { options?: typeof options }).options = options;
      return {
        login: mockLogin,
        status: mockStatus,
        error: mockError,
        reset: mockReset,
      };
    },
  };
});

beforeEach(() => {
  mockLogin.mockReset();
  mockReset.mockReset();
  toastError.mockReset();
  mockStatus = 'idle';
  mockError = null;
});

describe('GoogleLoginButton', () => {
  it('renders a Google icon-only button with correct aria-label', () => {
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>
    );
    const btn = screen.getByRole('button', { name: /đăng nhập bằng google/i });
    expect(btn).toBeInTheDocument();
    // icon-only: h-10 (height only, width giãn theo cột grid như Facebook/GitHub)
    expect(btn).toHaveClass('h-10');
    expect(btn).not.toHaveClass('w-10');
  });

  it('renders Google logo svg', () => {
    const { container } = render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>
    );
    // The button contains an SVG icon
    const svg = container.querySelector('button svg');
    expect(svg).toBeInTheDocument();
  });

  it('calls useGoogleLogin.login() on click', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>
    );
    await user.click(
      screen.getByRole('button', { name: /đăng nhập bằng google/i })
    );
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('disables button when status is opening-popup', () => {
    mockStatus = 'opening-popup';
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>
    );
    const btn = screen.getByRole('button', { name: /đăng nhập bằng google/i });
    expect(btn).toBeDisabled();
  });

  it('disables button when status is authenticating', () => {
    mockStatus = 'authenticating';
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>
    );
    const btn = screen.getByRole('button', { name: /đăng nhập bằng google/i });
    expect(btn).toBeDisabled();
  });

  it('shows loading spinner when status is opening-popup or authenticating', () => {
    mockStatus = 'authenticating';
    const { container } = render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>
    );
    // Spinner is a Loader2 icon (svg with animate-spin class)
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('hides Google icon when status is opening-popup or authenticating', () => {
    mockStatus = 'authenticating';
    const { container } = render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>
    );
    // Google logo is the only svg when idle. When loading, only the spinner
    // is rendered (which is also an svg). So we check by aria-label of btn
    // being the loading variant, or by class on the spinner.
    const btn = container.querySelector('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('passes onSuccess callback to useGoogleLogin', () => {
    const onSuccess = vi.fn();
    render(
      <TestWrapper>
        <GoogleLoginButton onSuccess={onSuccess} />
      </TestWrapper>
    );
    expect(
      (mockLogin as unknown as { options?: { onSuccess?: unknown } }).options
        ?.onSuccess
    ).toBe(onSuccess);
  });

  it('passes onError callback to useGoogleLogin', () => {
    const onError = vi.fn();
    render(
      <TestWrapper>
        <GoogleLoginButton onError={onError} />
      </TestWrapper>
    );
    expect(
      (mockLogin as unknown as { options?: { onError?: unknown } }).options
        ?.onError
    ).toBe(onError);
  });

  it('shows error toast when useGoogleLogin error is set (status=error)', async () => {
    mockStatus = 'error';
    mockError = new Error('POPUP_BLOCKED');
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
  });

  it('invokes onError prop when useGoogleLogin calls its onError callback', () => {
    const onError = vi.fn();
    render(
      <TestWrapper>
        <GoogleLoginButton onError={onError} />
      </TestWrapper>
    );
    const hookOnError = (
      mockLogin as unknown as { options?: { onError?: (e: Error) => void } }
    ).options?.onError;
    expect(hookOnError).toBeDefined();
    hookOnError?.(new Error('boom'));
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('invokes onSuccess prop when useGoogleLogin calls its onSuccess callback', () => {
    const onSuccess = vi.fn();
    render(
      <TestWrapper>
        <GoogleLoginButton onSuccess={onSuccess} />
      </TestWrapper>
    );
    const hookOnSuccess = (
      mockLogin as unknown as { options?: { onSuccess?: (u: unknown) => void } }
    ).options?.onSuccess;
    expect(hookOnSuccess).toBeDefined();
    hookOnSuccess?.({ id: '1', email: 'a@b.c' });
    expect(onSuccess).toHaveBeenCalledWith({ id: '1', email: 'a@b.c' });
  });

  it('maps POPUP_BLOCKED error code to i18n toast message', async () => {
    // Simulate the hook reaching error state with POPUP_BLOCKED code
    mockStatus = 'error';
    mockError = new Error('POPUP_BLOCKED');
    render(
      <TestWrapper>
        <GoogleLoginButton />
      </TestWrapper>
    );
    // Toast should fire with the i18n-mapped message
    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
    const lastCall = toastError.mock.calls[toastError.mock.calls.length - 1];
    // Message must NOT be the raw 'POPUP_BLOCKED' code
    expect(lastCall[0]).not.toBe('POPUP_BLOCKED');
    // i18n key for popup-blocked in vi
    expect(String(lastCall[0])).toMatch(/trình duyệt|popup|cửa sổ/i);
  });
});
