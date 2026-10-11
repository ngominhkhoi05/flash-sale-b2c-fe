import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { ROUTES } from '@/lib/constants';

// Mock next/navigation because LoginForm uses useRouter + useSearchParams
const mockPush = vi.fn();
const mockUseSearchParams = vi.fn<() => URLSearchParams>(() => new URLSearchParams());

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

// Mock the auth hook used by LoginForm
// `mutate` calls the onSuccess callback so we can assert navigation behavior.
const mockMutate = vi.fn(
  (
    _data: unknown,
    options?: { onSuccess?: () => void; onError?: () => void },
  ) => {
    options?.onSuccess?.();
  },
);

vi.mock('@/features/auth', async () => {
  const actual = await vi.importActual<typeof import('@/features/auth')>(
    '@/features/auth'
  );
  return {
    ...actual,
    useLoginMutation: () => ({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    }),
  };
});

function withQueryClient(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>
  );
}

describe('LoginForm', () => {
  it('renders identifier, password fields and submit button', () => {
    withQueryClient(<LoginForm />);
    expect(
      screen.getByLabelText(/Email hoặc Số điện thoại/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Nhập mật khẩu/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Đăng nhập/i })
    ).toBeInTheDocument();
  });

  it('shows validation error for empty identifier on submit', async () => {
    const user = userEvent.setup();
    withQueryClient(<LoginForm />);
    await user.click(screen.getByRole('button', { name: /Đăng nhập/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Vui lòng nhập email hoặc số điện thoại/i)
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for too-short password', async () => {
    const user = userEvent.setup();
    withQueryClient(<LoginForm />);
    await user.type(
      screen.getByLabelText(/Email hoặc Số điện thoại/i),
      'user@example.com'
    );
    // Use placeholder to uniquely target the password input
    await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'short');
    await user.click(screen.getByRole('button', { name: /Đăng nhập/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Mật khẩu tối thiểu 8 ký tự/i)
      ).toBeInTheDocument();
    });
  });

  it('renders the "Quên mật khẩu?" link', () => {
    withQueryClient(<LoginForm />);
    const link = screen.getByRole('link', { name: /Quên mật khẩu/i });
    expect(link).toHaveAttribute('href', '/quen-mat-khau');
  });

  it('renders the "Đăng ký ngay" link', () => {
    withQueryClient(<LoginForm />);
    const link = screen.getByRole('link', { name: /Đăng ký ngay/i });
    expect(link).toHaveAttribute('href', '/dang-ky');
  });

  it('renders Remember me checkbox unchecked by default', () => {
    withQueryClient(<LoginForm />);
    const checkbox = screen.getByRole('checkbox', {
      name: /Ghi nhớ đăng nhập/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('toggles Remember me checkbox on click', async () => {
    const user = userEvent.setup();
    withQueryClient(<LoginForm />);
    const checkbox = screen.getByRole('checkbox', {
      name: /Ghi nhớ đăng nhập/i,
    });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  // ── ?redirect= query param support (auth-guard flow) ───────────────────
  describe('?redirect= query param', () => {
    it('navigates to HOME when no redirect param', async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams());
      const user = userEvent.setup();
      withQueryClient(<LoginForm />);
      await user.type(
        screen.getByLabelText(/Email hoặc Số điện thoại/i),
        'user@example.com',
      );
      await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'password123');
      await user.click(screen.getByRole('button', { name: /Đăng nhập/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.HOME);
      });
    });

    it('navigates to /gio-hang when redirect=/gio-hang', async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('redirect=/gio-hang'));
      const user = userEvent.setup();
      withQueryClient(<LoginForm />);
      await user.type(
        screen.getByLabelText(/Email hoặc Số điện thoại/i),
        'user@example.com',
      );
      await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'password123');
      await user.click(screen.getByRole('button', { name: /Đăng nhập/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/gio-hang');
      });
    });

    it('navigates to /kho-voucher when redirect=/kho-voucher', async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('redirect=/kho-voucher'));
      const user = userEvent.setup();
      withQueryClient(<LoginForm />);
      await user.type(
        screen.getByLabelText(/Email hoặc Số điện thoại/i),
        'user@example.com',
      );
      await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'password123');
      await user.click(screen.getByRole('button', { name: /Đăng nhập/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/kho-voucher');
      });
    });

    it('navigates to HOME (not external URL) when redirect=https://evil.com', async () => {
      // Open redirect attack: nếu không sanitize, attacker có thể redirect user
      // sang domain khác sau login. Helper `sanitizeRedirectPath` phải chặn.
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams('redirect=' + encodeURIComponent('https://evil.com/x')),
      );
      const user = userEvent.setup();
      withQueryClient(<LoginForm />);
      await user.type(
        screen.getByLabelText(/Email hoặc Số điện thoại/i),
        'user@example.com',
      );
      await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'password123');
      await user.click(screen.getByRole('button', { name: /Đăng nhập/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.HOME);
        expect(mockPush).not.toHaveBeenCalledWith('https://evil.com/x');
      });
    });

    it('navigates to HOME (not protocol-relative URL) when redirect=//evil.com', async () => {
      // Protocol-relative URL: //evil.com → domain ngoài
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams('redirect=' + encodeURIComponent('//evil.com/x')),
      );
      const user = userEvent.setup();
      withQueryClient(<LoginForm />);
      await user.type(
        screen.getByLabelText(/Email hoặc Số điện thoại/i),
        'user@example.com',
      );
      await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'password123');
      await user.click(screen.getByRole('button', { name: /Đăng nhập/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(ROUTES.HOME);
      });
    });
  });
});
