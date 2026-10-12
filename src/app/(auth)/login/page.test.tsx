import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import DangNhapPage from './page';
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
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the auth hook
vi.mock('@/features/auth', async () => {
  const actual = await vi.importActual<typeof import('@/features/auth')>(
    '@/features/auth'
  );
  return {
    ...actual,
    useLoginMutation: () => ({
      mutate: vi.fn(),
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

describe('DangNhapPage', () => {
  it('renders the brand panel, login form, and social buttons', () => {
    withQueryClient(<DangNhapPage />);
    // Brand panel
    expect(screen.getByTestId('auth-brand-panel')).toBeInTheDocument();
    // LoginForm
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    // Social buttons
    expect(screen.getByTestId('social-login-buttons')).toBeInTheDocument();
    // Note: AuthHeader/AuthFooter are tested separately and are
    // provided by (auth)/layout.tsx, not by the page itself.
  });

  it('renders the form fields and submit button', () => {
    withQueryClient(<DangNhapPage />);
    expect(
      screen.getByLabelText(/Email hoặc Số điện thoại/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập mật khẩu/i)).toBeInTheDocument();
    expect(
      screen.getByTestId('login-submit')
    ).toBeInTheDocument();
  });});
