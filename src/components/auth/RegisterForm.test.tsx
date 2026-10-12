import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RegisterForm } from './RegisterForm';
import { TestWrapper } from '@/__tests__/test-wrapper';

// Mock next/navigation
const routerPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock sonner toast
const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
    info: vi.fn(),
  },
}));

// Mock auth feature
const mockMutate = vi.fn();
vi.mock('@/features/auth', async () => {
  const actual = await vi.importActual<typeof import('@/features/auth')>(
    '@/features/auth'
  );
  return {
    ...actual,
    useRegisterMutation: () => ({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    }),
  };
});

beforeEach(() => {
  toastError.mockClear();
  toastSuccess.mockClear();
  routerPush.mockClear();
  mockMutate.mockClear();
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

describe('RegisterForm', () => {
  it('renders the form title and subtitle', () => {
    withQueryClient(<RegisterForm />);
    expect(screen.getByText(/Tạo tài khoản/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Chỉ mất 1 phút để bắt đầu nhận ưu đãi/i)
    ).toBeInTheDocument();
  });

  it('renders all 5 form fields', () => {
    withQueryClient(<RegisterForm />);
    expect(screen.getByLabelText(/Họ và tên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập mật khẩu/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Nhập lại mật khẩu vừa tạo/i)
    ).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    withQueryClient(<RegisterForm />);
    expect(screen.getByTestId('register-submit')).toBeInTheDocument();
  });

  it('renders the "Đã có tài khoản? Đăng nhập" link', () => {
    withQueryClient(<RegisterForm />);
    expect(
      screen.getByRole('link', { name: /Đăng nhập/i })
    ).toHaveAttribute('href', '/login');
  });

  it('renders 3 social register buttons', () => {
    withQueryClient(<RegisterForm />);
    expect(
      screen.getByTestId('social-register-buttons')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Đăng ký bằng Google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Đăng ký bằng Facebook/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Đăng ký bằng GitHub/i })
    ).toBeInTheDocument();
  });

  it('renders terms checkbox', () => {
    withQueryClient(<RegisterForm />);
    expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument();
  });

  it('renders password strength bar with 4 segments', () => {
    withQueryClient(<RegisterForm />);
    expect(screen.getByTestId('password-strength')).toBeInTheDocument();
    expect(screen.getByTestId('strength-seg-1')).toBeInTheDocument();
    expect(screen.getByTestId('strength-seg-4')).toBeInTheDocument();
  });

  it('shows validation error for empty fullName on submit', async () => {
    const user = userEvent.setup();
    withQueryClient(<RegisterForm />);
    await user.click(screen.getByTestId('register-submit'));
    await waitFor(() => {
      expect(
        screen.getByText(/Vui lòng nhập họ và tên/i)
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    withQueryClient(<RegisterForm />);
    await user.type(screen.getByLabelText(/Họ và tên/i), 'Nguyễn Văn An');
    await user.type(screen.getByLabelText(/Email/i), 'not-an-email');
    await user.click(screen.getByTestId('register-submit'));
    await waitFor(() => {
      expect(
        screen.getByText(/Email không hợp lệ/i)
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    withQueryClient(<RegisterForm />);
    await user.type(screen.getByLabelText(/Họ và tên/i), 'Nguyễn Văn An');
    await user.type(screen.getByLabelText(/Email/i), 'an@example.com');
    await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'short');
    await user.click(screen.getByTestId('register-submit'));
    await waitFor(() => {
      expect(
        screen.getByText(/Mật khẩu tối thiểu 8 ký tự/i)
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for password without digits', async () => {
    const user = userEvent.setup();
    withQueryClient(<RegisterForm />);
    await user.type(screen.getByLabelText(/Họ và tên/i), 'Nguyễn Văn An');
    await user.type(screen.getByLabelText(/Email/i), 'an@example.com');
    await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'NoDigitsHere');
    await user.click(screen.getByTestId('register-submit'));
    await waitFor(() => {
      expect(
        screen.getByText(/Mật khẩu phải có ít nhất 1 chữ số/i)
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for mismatched confirmPassword', async () => {
    const user = userEvent.setup();
    withQueryClient(<RegisterForm />);
    await user.type(screen.getByLabelText(/Họ và tên/i), 'Nguyễn Văn An');
    await user.type(screen.getByLabelText(/Email/i), 'an@example.com');
    await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'VibeMart@2026');
    await user.type(
      screen.getByPlaceholderText(/Nhập lại mật khẩu vừa tạo/i),
      'DifferentPass1'
    );
    await user.click(screen.getByTestId('register-submit'));
    await waitFor(() => {
      expect(
        screen.getByText(/Mật khẩu nhập lại không khớp/i)
      ).toBeInTheDocument();
    });
  });

  it('does NOT call mutation when terms checkbox is unchecked', async () => {
    const user = userEvent.setup();
    withQueryClient(<RegisterForm />);
    await user.type(screen.getByLabelText(/Họ và tên/i), 'Nguyễn Văn An');
    await user.type(screen.getByLabelText(/Email/i), 'an@example.com');
    await user.type(screen.getByPlaceholderText(/Nhập mật khẩu/i), 'VibeMart@2026');
    await user.type(
      screen.getByPlaceholderText(/Nhập lại mật khẩu vừa tạo/i),
      'VibeMart@2026'
    );
    // terms not checked
    await user.click(screen.getByTestId('register-submit'));
    // Should NOT call mutation (terms not agreed)
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('toggles show/hide password visibility', async () => {
    const user = userEvent.setup();
    withQueryClient(<RegisterForm />);
    const passwordInput = screen.getByPlaceholderText(
      /Nhập mật khẩu/i
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    // Click the toggle button (eye icon) - it's the button inside the password field's container
    const toggleBtn = screen.getByRole('button', {
      name: /Hiện mật khẩu/i,
    });
    await user.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('toggles terms checkbox on click', async () => {
    const user = userEvent.setup();
    withQueryClient(<RegisterForm />);
    const checkbox = screen.getByTestId('terms-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('does not render the +84 phone prefix (user types full number)', () => {
    withQueryClient(<RegisterForm />);
    expect(screen.queryByText('+84')).not.toBeInTheDocument();
  });
});
