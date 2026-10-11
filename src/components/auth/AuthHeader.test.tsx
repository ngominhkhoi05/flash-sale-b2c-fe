import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthHeader } from './AuthHeader';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { ROUTES } from '@/lib/constants';

describe('AuthHeader', () => {
  it('renders the brand logo with Vibe Mart wordmark', () => {
    render(
      <TestWrapper>
        <AuthHeader />
      </TestWrapper>
    );
    const logo = screen.getByRole('img', { name: /Vibe Mart/i });
    expect(logo).toBeInTheDocument();
  });

  it('renders the auth label (Xác thực tài khoản)', () => {
    render(
      <TestWrapper>
        <AuthHeader />
      </TestWrapper>
    );
    expect(screen.getByText(/Xác thực tài khoản/i)).toBeInTheDocument();
  });

  it('renders the "Trợ giúp" nav link', () => {
    render(
      <TestWrapper>
        <AuthHeader />
      </TestWrapper>
    );
    const helpLink = screen.getByRole('link', { name: /Trợ giúp/i });
    expect(helpLink).toHaveAttribute('href', ROUTES.HELP);
  });

  it('renders the "Về trang chủ" nav link', () => {
    render(
      <TestWrapper>
        <AuthHeader />
      </TestWrapper>
    );
    const homeLink = screen.getByRole('link', { name: /Về trang chủ/i });
    expect(homeLink).toHaveAttribute('href', ROUTES.HOME);
  });
});
