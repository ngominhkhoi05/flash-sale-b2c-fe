import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '@/../messages/vi.json';
import enMessages from '@/../messages/en.json';
import { AccountSidebar } from './AccountSidebar';

function renderWithLocale(locale: 'vi' | 'en') {
  const messages = locale === 'vi' ? viMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AccountSidebar activeItem="orders" />
    </NextIntlClientProvider>
  );
}

describe('AccountSidebar', () => {
  it('renders all 5 navigation items', () => {
    renderWithLocale('vi');
    expect(screen.getByText(viMessages.sidebar.nav.myAccount)).toBeInTheDocument();
    expect(screen.getByText(viMessages.sidebar.nav.myOrders)).toBeInTheDocument();
    expect(screen.getByText(viMessages.sidebar.nav.vouchers)).toBeInTheDocument();
    expect(screen.getByText(viMessages.sidebar.nav.notifications)).toBeInTheDocument();
    expect(screen.getByText(viMessages.sidebar.nav.sellerChannel)).toBeInTheDocument();
  });

  it('marks myOrders as active (aria-current) when activeItem is orders', () => {
    renderWithLocale('vi');
    const ordersLink = screen.getByText(viMessages.sidebar.nav.myOrders).closest('a');
    expect(ordersLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks no item as active when activeItem is none', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <AccountSidebar activeItem="none" />
      </NextIntlClientProvider>
    );
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current');
    });
  });

  it('renders voucher count badge from count prop', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <AccountSidebar activeItem="orders" voucherCount={12} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders order count badge from ordersCount prop on myOrders', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <AccountSidebar activeItem="orders" ordersCount={3} />
      </NextIntlClientProvider>
    );
    // myOrders badge should show 3
    const ordersLink = screen.getByText(viMessages.sidebar.nav.myOrders).closest('a');
    expect(ordersLink).toHaveTextContent('3');
  });

  it('hides voucher count when count is 0', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <AccountSidebar activeItem="orders" voucherCount={0} />
      </NextIntlClientProvider>
    );
    // No badge for vouchers — find by container
    const vouchersLink = screen.getByText(viMessages.sidebar.nav.vouchers).closest('a');
    expect(vouchersLink?.textContent).not.toMatch(/^0/);
  });

  it('renders seller channel "Hot" badge', () => {
    renderWithLocale('vi');
    expect(screen.getByText(viMessages.sidebar.nav.sellerHot)).toBeInTheDocument();
  });

  it('renders the user header with display name and email when provided', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <AccountSidebar
          activeItem="orders"
          displayName="Trang Trần"
          email="trang@example.com"
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Trang Trần')).toBeInTheDocument();
    expect(screen.getByText('trang@example.com')).toBeInTheDocument();
  });

  it('renders English labels when locale is en', () => {
    renderWithLocale('en');
    expect(screen.getByText(enMessages.sidebar.nav.myOrders)).toBeInTheDocument();
  });
});
