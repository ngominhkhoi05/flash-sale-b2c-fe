import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '@/../messages/vi.json';
import { OrderList, type OrderListCardData } from './OrderList';

const sampleOrder: OrderListCardData = {
  orderId: 1,
  orderCode: 'FS-001',
  storeName: 'TechZone Official',
  status: 'PENDING_PAYMENT',
  totalAmount: 299000,
  items: [
    {
      id: 'i1',
      name: 'Tai nghe Bluetooth',
      variant: 'Màu Đen',
      quantity: 1,
      price: 299000,
      thumbnail: 'https://example.com/img.jpg',
    },
  ],
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
};

function renderList(props: Partial<React.ComponentProps<typeof OrderList>> = {}) {
  const onCancel = vi.fn();
  const onPayNow = vi.fn();
  const onReview = vi.fn();
  const result = render(
    <NextIntlClientProvider locale="vi" messages={viMessages} timeZone="UTC">
      <OrderList
        orders={[sampleOrder]}
        onCancel={onCancel}
        onPayNow={onPayNow}
        onReview={onReview}
        onViewShop={vi.fn()}
        onContactShop={vi.fn()}
        onTrackOrder={vi.fn()}
        onReorder={vi.fn()}
        {...props}
      />
    </NextIntlClientProvider>
  );
  return { ...result, onCancel, onPayNow, onReview };
}

describe('OrderList', () => {
  it('renders an OrderCard for each order', () => {
    renderList({
      orders: [sampleOrder, { ...sampleOrder, orderId: 2, orderCode: 'FS-002' }],
    });
    expect(screen.getAllByTestId('order-card')).toHaveLength(2);
  });

  it('shows skeleton placeholders when isLoading', () => {
    renderList({ orders: [], isLoading: true, skeletonCount: 3 });
    const skeletons = screen.getAllByLabelText('Loading order');
    expect(skeletons).toHaveLength(3);
  });

  it('bubbles onPayNow from card to parent', async () => {
    const { onPayNow } = renderList();
    await userEvent.click(screen.getByRole('button', { name: viMessages.orders.payNow }));
    expect(onPayNow).toHaveBeenCalledWith(1);
  });

  it('bubbles onCancel from card to parent', async () => {
    const { onCancel } = renderList();
    await userEvent.click(screen.getByRole('button', { name: viMessages.orders.cancel }));
    expect(onCancel).toHaveBeenCalledWith(1);
  });

  it('bubbles onReview from card to parent', async () => {
    const order = { ...sampleOrder, status: 'COMPLETED' as const, deliveredAt: new Date().toISOString() };
    const { onReview } = renderList({ orders: [order] });
    await userEvent.click(screen.getByTestId('review-trigger'));
    expect(onReview).toHaveBeenCalledWith(1);
  });
});
