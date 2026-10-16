import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSubmitReview } from './hooks';
import { submitReview } from './review-api';

vi.mock('./review-api', () => ({
  submitReview: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  Wrapper.displayName = 'TestQueryClientWrapper';
  return Wrapper;
}

describe('useSubmitReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls submitReview with orderId and body', async () => {
    vi.mocked(submitReview).mockResolvedValue({ success: true, reviewId: 99 });

    const { result } = renderHook(() => useSubmitReview(), { wrapper: createWrapper() });

    result.current.mutate({ orderId: 7, body: { rating: 5, comment: 'ok', mediaUrls: [], anonymous: false } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(submitReview).toHaveBeenCalledWith(7, {
      rating: 5,
      comment: 'ok',
      mediaUrls: [],
      anonymous: false,
    });
  });

  it('invalidates orders list on success', async () => {
    vi.mocked(submitReview).mockResolvedValue({ success: true, reviewId: 99 });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = function TestWrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };

    const { result } = renderHook(() => useSubmitReview(), { wrapper });
    result.current.mutate({ orderId: 1, body: { rating: 4, comment: '', mediaUrls: [], anonymous: false } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('exposes error on failure', async () => {
    vi.mocked(submitReview).mockRejectedValue(new Error('BE error'));

    const { result } = renderHook(() => useSubmitReview(), { wrapper: createWrapper() });
    result.current.mutate({ orderId: 1, body: { rating: 3, comment: '', mediaUrls: [], anonymous: false } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
