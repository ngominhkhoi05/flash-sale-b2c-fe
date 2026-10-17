/**
 * Test cho /orders page (Server Component).
 *
 * Page redirect về /login nếu chưa auth. Test 2 nhánh:
 *  - Không session → redirect
 *  - Có session → render OrdersPageClient
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';
import OrdersPage from './page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth-guard', () => ({
  maybeSession: vi.fn(),
}));

const { maybeSession } = await import('@/lib/auth-guard');

vi.mock('./OrdersPageClient', () => ({
  OrdersPageClient: () => <div data-testid="orders-page-client">Orders Page Client</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OrdersPage (Server Component)', () => {
  it('redirects to /login when no session', async () => {
    vi.mocked(maybeSession).mockResolvedValue(null);
    await OrdersPage();
    expect(redirect).toHaveBeenCalledWith('/login?redirect=/orders');
  });

  it('renders OrdersPageClient when session exists', async () => {
    vi.mocked(maybeSession).mockResolvedValue({
      userId: '1',
      role: 'BUYER',
      token: 'tok',
      email: 'u@e.com',
    });
    const result = await OrdersPage();
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
