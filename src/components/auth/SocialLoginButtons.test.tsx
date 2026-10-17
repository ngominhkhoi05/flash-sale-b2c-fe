import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SocialLoginButtons } from './SocialLoginButtons';
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
const mockGoogleRedirect = vi.fn();
vi.mock('@/features/auth/useGoogleRedirect', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/auth/useGoogleRedirect')>();
  return {
    ...actual,
    useGoogleRedirect: () => ({
      redirect: mockGoogleRedirect,
      status: 'idle',
      error: null,
      reset: vi.fn(),
    }),
  };
});

beforeEach(() => {
  toastError.mockClear();
  mockGoogleRedirect.mockClear();
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, search: '' },
    });
  }
});

describe('SocialLoginButtons', () => {
  it('renders the divider "hoặc tiếp tục với"', () => {
    render(
      <TestWrapper>
        <SocialLoginButtons />
      </TestWrapper>,
    );
    expect(screen.getByText(/hoặc tiếp tục với/i)).toBeInTheDocument();
  });

  it('renders 3 social buttons: Google, Facebook, GitHub', () => {
    render(
      <TestWrapper>
        <SocialLoginButtons />
      </TestWrapper>,
    );
    expect(
      screen.getByRole('button', { name: /Đăng nhập bằng Google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Đăng nhập bằng Facebook/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Đăng nhập bằng GitHub/i }),
    ).toBeInTheDocument();
  });

  it('gọi useGoogleRedirect.redirect khi Google button clicked (KHÔNG toast)', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SocialLoginButtons />
      </TestWrapper>,
    );
    await user.click(
      screen.getByRole('button', { name: /Đăng nhập bằng Google/i }),
    );
    expect(mockGoogleRedirect).toHaveBeenCalledTimes(1);
    // Google flow dùng same-window redirect, không toast từ SocialLoginButtons
    expect(toastError).not.toHaveBeenCalled();
  });

  it('calls toast.error when Facebook button clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SocialLoginButtons />
      </TestWrapper>,
    );
    await user.click(
      screen.getByRole('button', { name: /Đăng nhập bằng Facebook/i }),
    );
    expect(toastError).toHaveBeenCalledWith('Chức năng đang phát triển');
  });

  it('calls toast.error when GitHub button clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SocialLoginButtons />
      </TestWrapper>,
    );
    await user.click(
      screen.getByRole('button', { name: /Đăng nhập bằng GitHub/i }),
    );
    expect(toastError).toHaveBeenCalledWith('Chức năng đang phát triển');
  });

  it('chấp nhận onGoogleSuccess callback prop (type: (state: string) => void)', () => {
    const onSuccess = vi.fn();
    expect(() =>
      render(
        <TestWrapper>
          <SocialLoginButtons onGoogleSuccess={onSuccess} />
        </TestWrapper>,
      ),
    ).not.toThrow();
  });
});
