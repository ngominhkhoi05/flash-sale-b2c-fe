import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '@/../messages/vi.json';
import { OrderCard, type OrderCardItem } from './OrderCard';

const baseItem: OrderCardItem = {
  id: '1',
  name: 'Tai nghe Bluetooth',
  variant: 'Màu Đen',
  quantity: 1,
  price: 299000,
  thumbnail: 'https://example.com/img.jpg',
};

function renderCard(props: Partial<React.ComponentProps<typeof OrderCard>> = {}) {
  const onCancel = vi.fn();
  const onPayNow = vi.fn();
  const onReorder = vi.fn();
  const onReview = vi.fn();
  const onViewShop = vi.fn();
  const onContactShop = vi.fn();
  const onTrackOrder = vi.fn();

  const result = render(
    <NextIntlClientProvider locale="vi" messages={viMessages} timeZone="UTC">
      <OrderCard
        orderCode="FS-001"
        storeName="TechZone Official"
        status="PENDING_PAYMENT"
        items={[baseItem]}
        totalAmount={299000}
        onCancel={onCancel}
        onPayNow={onPayNow}
        onReorder={onReorder}
        onReview={onReview}
        onViewShop={onViewShop}
        onContactShop={onContactShop}
        onTrackOrder={onTrackOrder}
        {...props}
      />
    </NextIntlClientProvider>
  );

  return { ...result, onCancel, onPayNow, onReorder, onReview, onViewShop, onContactShop, onTrackOrder };
}

describe('OrderCard', () => {
  it('renders store name, order code, status, and total', () => {
    renderCard();
    expect(screen.getByText('TechZone Official')).toBeInTheDocument();
    expect(screen.getByText(/#FS-001/)).toBeInTheDocument();
    expect(screen.getByText(viMessages.order.status.PENDING_PAYMENT)).toBeInTheDocument();
    const total = screen.getByTestId('total-amount');
    expect(total).toHaveTextContent(/299\.000\s*₫/);
  });

  it('renders each item with name, variant, qty, price', () => {
    renderCard();
    expect(screen.getByText('Tai nghe Bluetooth')).toBeInTheDocument();
    expect(screen.getByText(/Màu Đen/)).toBeInTheDocument();
    expect(screen.getByText(/x1/)).toBeInTheDocument();
  });

  it('renders the product thumbnail as an img', () => {
    renderCard();
    const img = screen.getByAltText(/Tai nghe Bluetooth/);
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
  });

  it('shows "Hủy đơn" + "Thanh toán ngay" buttons for PENDING_PAYMENT', () => {
    renderCard({ status: 'PENDING_PAYMENT' });
    expect(screen.getByRole('button', { name: viMessages.orders.cancel })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: viMessages.orders.payNow })).toBeInTheDocument();
  });

  it('shows countdown when expiresAt is provided and status PENDING_PAYMENT', () => {
    renderCard({
      status: 'PENDING_PAYMENT',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    expect(screen.getByTestId('countdown')).toBeInTheDocument();
  });

  it('hides countdown when no expiresAt', () => {
    renderCard({ status: 'PENDING_PAYMENT', expiresAt: undefined });
    expect(screen.queryByTestId('countdown')).not.toBeInTheDocument();
  });

  it('shows "Liên hệ shop" + "Xem lộ trình" buttons for SHIPPING', () => {
    renderCard({ status: 'SHIPPING' });
    expect(screen.getByRole('button', { name: viMessages.orders.contactShop })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: viMessages.orders.trackOrder })).toBeInTheDocument();
  });

  it('shows shipping notice when shippingCarrier provided', () => {
    renderCard({
      status: 'SHIPPING',
      shippingCarrier: 'SPX Express',
      shippingLocation: 'TP. Thủ Đức',
      etaText: 'Hôm nay, trước 18:00',
    });
    expect(
      screen.getByText(/SPX Express.*TP\. Thủ Đức/)
    ).toBeInTheDocument();
  });

  it('shows "Mua lại" + "Đánh giá ngay" buttons for COMPLETED', () => {
    renderCard({ status: 'COMPLETED' });
    expect(screen.getByRole('button', { name: viMessages.orders.reorder })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: viMessages.orders.reviewNow })).toBeInTheDocument();
  });

  it('shows completed notice when deliveredAt provided', () => {
    renderCard({
      status: 'COMPLETED',
      deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(screen.getByTestId('completed-notice')).toBeInTheDocument();
  });

  it('shows "Mua lại" for CANCELLED (no review, no cancel)', () => {
    renderCard({ status: 'CANCELLED' });
    expect(screen.getByRole('button', { name: viMessages.orders.reorder })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: viMessages.orders.cancel })).not.toBeInTheDocument();
  });

  it('shows cancelled notice when status is CANCELLED_TIMEOUT', () => {
    renderCard({ status: 'CANCELLED_TIMEOUT' });
    expect(screen.getByTestId('cancelled-notice')).toBeInTheDocument();
  });

  it('calls onPayNow when "Thanh toán ngay" clicked', async () => {
    const { onPayNow } = renderCard({ status: 'PENDING_PAYMENT' });
    await userEvent.click(screen.getByRole('button', { name: viMessages.orders.payNow }));
    expect(onPayNow).toHaveBeenCalled();
  });

  it('calls onCancel when "Hủy đơn" clicked', async () => {
    const { onCancel } = renderCard({ status: 'PENDING_PAYMENT' });
    await userEvent.click(screen.getByRole('button', { name: viMessages.orders.cancel }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onReview when "Đánh giá ngay" clicked', async () => {
    const { onReview } = renderCard({ status: 'COMPLETED' });
    await userEvent.click(screen.getByRole('button', { name: viMessages.orders.reviewNow }));
    expect(onReview).toHaveBeenCalled();
  });

  it('calls onViewShop when "Xem shop" clicked', async () => {
    const { onViewShop } = renderCard();
    await userEvent.click(screen.getByRole('button', { name: viMessages.orders.viewShop }));
    expect(onViewShop).toHaveBeenCalled();
  });

  it('renders multiple items with separator', () => {
    const items: OrderCardItem[] = [
      { ...baseItem, id: '1', name: 'Item 1' },
      { ...baseItem, id: '2', name: 'Item 2' },
      { ...baseItem, id: '3', name: 'Item 3' },
    ];
    renderCard({ items });
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });
});
