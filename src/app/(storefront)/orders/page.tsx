/**
 * Trang Đơn mua của tôi — `/orders`.
 *
 * Server Component:
 * - Validate auth (cookie `access_token`) → redirect về /login nếu chưa.
 * - Render `<OrdersPageClient />` (Client Component) — chứa state cho tabs, search, dialog.
 *
 * @see src/app/(storefront)/orders/OrdersPageClient.tsx
 */
import { redirect } from 'next/navigation';
import { maybeSession } from '@/lib/auth-guard';
import { OrdersPageClient } from './OrdersPageClient';

export const metadata = {
  title: 'Đơn mua của tôi – Vibe Mart',
  description: 'Quản lý và theo dõi đơn hàng Vibe Mart của bạn.',
};

export default async function OrdersPage() {
  const session = await maybeSession();
  if (!session) {
    redirect('/login?redirect=/orders');
  }
  return <OrdersPageClient />;
}
