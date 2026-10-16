import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '@/../messages/vi.json';
import enMessages from '@/../messages/en.json';
import { OrdersTabs } from './OrdersTabs';

  function renderWithLocale(locale: 'vi' | 'en', activeTab = 'all', onChange = vi.fn()) {
  const messages = locale === 'vi' ? viMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <OrdersTabs activeTab={activeTab} onTabChange={onChange} />
    </NextIntlClientProvider>
  );
}

describe('OrdersTabs', () => {
  it('renders all 6 tabs', () => {
    renderWithLocale('vi');
    const tabs = viMessages.orders.tabs;
    expect(screen.getByRole('tab', { name: tabs.all })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: tabs.pendingPayment })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: tabs.confirmed })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: tabs.shipping })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: tabs.completed })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: tabs.cancelled })).toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    renderWithLocale('vi', 'pendingPayment');
    const tab = screen.getByRole('tab', { name: viMessages.orders.tabs.pendingPayment });
    expect(tab).toHaveAttribute('aria-selected', 'true');

    const allTab = screen.getByRole('tab', { name: viMessages.orders.tabs.all });
    expect(allTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTabChange when a tab is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages} timeZone="UTC">
        <OrdersTabs activeTab="all" onTabChange={onChange} />
      </NextIntlClientProvider>
    );
    await user.click(screen.getByRole('tab', { name: viMessages.orders.tabs.completed }));
    expect(onChange).toHaveBeenCalledWith('completed');
  });

  it('renders count badge when count > 0', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages} timeZone="UTC">
        <OrdersTabs activeTab="all" onTabChange={vi.fn()} counts={{ pendingPayment: 3 }} />
      </NextIntlClientProvider>
    );
    const tab = screen.getByRole('tab', { name: new RegExp(viMessages.orders.tabs.pendingPayment) });
    expect(tab).toHaveTextContent('3');
  });

  it('does not render badge when count is 0 or undefined', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages} timeZone="UTC">
        <OrdersTabs activeTab="all" onTabChange={vi.fn()} counts={{ pendingPayment: 0, completed: undefined }} />
      </NextIntlClientProvider>
    );
    const tab = screen.getByRole('tab', { name: new RegExp(viMessages.orders.tabs.pendingPayment) });
    expect(tab.textContent).toBe(viMessages.orders.tabs.pendingPayment);
  });

  it('renders English labels when locale is en', () => {
    renderWithLocale('en');
    expect(screen.getByRole('tab', { name: enMessages.orders.tabs.all })).toBeInTheDocument();
  });

  it('uses role tablist on the container', () => {
    renderWithLocale('vi');
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
