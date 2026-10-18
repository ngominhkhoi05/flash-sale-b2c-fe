import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '@/lib/api';
import type { ReviewInput } from './schemas/review';

export interface SubmitReviewResponse {
  success: boolean;
  reviewId: number;
  message?: string;
}

/**
 * POST /api/v1/orders/{id}/reviews
 *
 * Gửi đánh giá sản phẩm cho 1 đơn hàng đã hoàn thành.
 *
 * TODO(api): BE endpoint dự kiến `POST /api/v1/orders/{id}/reviews`.
 * Hiện tại chưa có trong docs/api-document.md — verify với backend khi integrate.
 */
export async function submitReview(
  orderId: number,
  body: ReviewInput
): Promise<SubmitReviewResponse> {
  if (!orderId || orderId <= 0) {
    throw new Error('orderId is required');
  }
  return apiFetch<SubmitReviewResponse>(`/api/v1/orders/${orderId}/reviews`, {
    method: 'POST',
    json: body,
    headers: {
      'X-Idempotency-Key': uuidv4(),
    },
  });
}
