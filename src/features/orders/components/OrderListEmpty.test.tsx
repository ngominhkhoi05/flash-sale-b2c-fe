import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '@/../messages/vi.json';
import { OrderListEmpty } from './OrderListEmpty';

describe('OrderListEmpty', () => {
  it('renders title, description, and action button', () => {
    const onAction = vi.fn();
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages} timeZone="UTC">
        <OrderListEmpty
          title={viMessages.orders.empty.title}
          description={viMessages.orders.empty.description}
          actionLabel={viMessages.orders.empty.action}
          onAction={onAction}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(viMessages.orders.empty.title)).toBeInTheDocument();
    expect(screen.getByText(viMessages.orders.empty.description)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: viMessages.orders.empty.action })).toBeInTheDocument();
  });

  it('calls onAction when action button clicked', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages} timeZone="UTC">
        <OrderListEmpty
          title="Empty"
          description="No orders"
          actionLabel="Browse"
          onAction={onAction}
        />
      </NextIntlClientProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Browse' }));
    expect(onAction).toHaveBeenCalled();
  });
});
