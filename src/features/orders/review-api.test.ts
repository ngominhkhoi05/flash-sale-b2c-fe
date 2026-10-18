import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitReview, type SubmitReviewResponse } from './review-api';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

const mockSuccess: SubmitReviewResponse = { success: true, reviewId: 1 };

describe('submitReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POSTs to /api/v1/orders/{id}/reviews with body and Idempotency-Key header', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockSuccess);

    await submitReview(42, {
      rating: 5,
      comment: 'Tốt',
      mediaUrls: [],
      anonymous: false,
    });

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/v1/orders/42/reviews',
      expect.objectContaining({
        method: 'POST',
        json: expect.objectContaining({ rating: 5, comment: 'Tốt' }),
        headers: expect.objectContaining({
          'X-Idempotency-Key': expect.any(String),
        }),
      })
    );
  });

  it('generates a unique Idempotency-Key per call', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockSuccess);

    await submitReview(42, { rating: 5, comment: '', mediaUrls: [], anonymous: false });
    await submitReview(42, { rating: 4, comment: '', mediaUrls: [], anonymous: false });

    const calls = vi.mocked(apiFetch).mock.calls;
    const opts1 = calls[0][1] as { headers: Record<string, string> };
    const opts2 = calls[1][1] as { headers: Record<string, string> };
    const key1 = opts1.headers['X-Idempotency-Key'];
    const key2 = opts2.headers['X-Idempotency-Key'];
    expect(key1).toBeTruthy();
    expect(key2).toBeTruthy();
    expect(key1).not.toEqual(key2);
  });

  it('rejects when orderId is invalid', async () => {
    await expect(
      submitReview(0, { rating: 5, comment: '', mediaUrls: [], anonymous: false })
    ).rejects.toThrow('orderId is required');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('rejects when orderId is negative', async () => {
    await expect(
      submitReview(-1, { rating: 5, comment: '', mediaUrls: [], anonymous: false })
    ).rejects.toThrow('orderId is required');
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
