import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthFooter } from './AuthFooter';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { ROUTES } from '@/lib/constants';

describe('AuthFooter', () => {
  it('renders the copyright text', () => {
    render(
      <TestWrapper>
        <AuthFooter />
      </TestWrapper>
    );
    expect(
      screen.getByText(/© 2026 Vibe Mart\. Tất cả các quyền được bảo lưu\./i)
    ).toBeInTheDocument();
  });

  it('renders the 3 footer links', () => {
    render(
      <TestWrapper>
        <AuthFooter />
      </TestWrapper>
    );
    expect(
      screen.getByRole('link', { name: /Điều khoản dịch vụ/i })
    ).toHaveAttribute('href', ROUTES.TERMS);
    expect(
      screen.getByRole('link', { name: /Chính sách bảo mật/i })
    ).toHaveAttribute('href', ROUTES.PRIVACY);
    expect(screen.getByRole('link', { name: /Liên hệ/i })).toHaveAttribute(
      'href',
      ROUTES.CONTACT
    );
  });
});
