import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import DangKyPage from './page';
import { TestWrapper } from '@/__tests__/test-wrapper';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock auth store – user is null (not logged in)
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: null,
    setUser: vi.fn(),
    reset: vi.fn(),
  }),
}));

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

describe('DangKyPage', () => {
  it('renders the brand panel and register form', () => {
    withQueryClient(<DangKyPage />);
    expect(screen.getByTestId('auth-brand-panel')).toBeInTheDocument();
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    withQueryClient(<DangKyPage />);
    expect(screen.getByLabelText(/Họ và tên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Nhập mật khẩu/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Nhập lại mật khẩu vừa tạo/i)
    ).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    withQueryClient(<DangKyPage />);
    expect(screen.getByTestId('register-submit')).toBeInTheDocument();
  });

  it('renders social register buttons', () => {
    withQueryClient(<DangKyPage />);
    expect(
      screen.getByTestId('social-register-buttons')
    ).toBeInTheDocument();
  });
});
