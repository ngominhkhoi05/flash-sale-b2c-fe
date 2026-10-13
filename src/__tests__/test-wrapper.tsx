import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import viMessages from '@/../messages/vi.json';
import enMessages from '@/../messages/en.json';

// Re-use a single QueryClient across renders in the same test file
// to avoid "duplicate queryClient" warnings + spurious refetch overhead.
let cachedClient: QueryClient | null = null;
function getTestQueryClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return cachedClient;
}

/**
 * Test wrapper for components that use next-intl + TanStack Query hooks.
 * - Provides NextIntlClientProvider with vi locale (default) + en fallback
 * - Provides QueryClientProvider with retry disabled and 0 staleTime
 *   so tests run deterministically and don't refetch on remount.
 * - Use this in render(<TestWrapper>...</TestWrapper>) for any component
 *   that calls useTranslations / useFormatter / useLocale from next-intl
 *   or useQuery / useMutation from @tanstack/react-query.
 *
 * Note: import messages from disk ensures parity tests work without
 * mocking. For locale switch tests, pass locale="en" via prop.
 */
export function TestWrapper({
  children,
  locale = 'vi',
}: {
  children: React.ReactNode;
  locale?: 'vi' | 'en';
}) {
  const messages = locale === 'en' ? enMessages : viMessages;
  return (
    <QueryClientProvider client={getTestQueryClient()}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}
