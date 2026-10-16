import { describe, it, expect } from 'vitest';
import { reviewSchema } from './review';

describe('reviewSchema', () => {
  it('accepts a complete valid review', () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: 'Sản phẩm rất tốt, giao hàng nhanh.',
      mediaUrls: ['https://cdn.example.com/img1.jpg'],
      anonymous: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating below 1', () => {
    const result = reviewSchema.safeParse({
      rating: 0,
      comment: 'abc',
      mediaUrls: [],
      anonymous: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['rating']);
    }
  });

  it('rejects rating above 5', () => {
    const result = reviewSchema.safeParse({
      rating: 6,
      comment: '',
      mediaUrls: [],
      anonymous: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer rating', () => {
    const result = reviewSchema.safeParse({
      rating: 4.5,
      comment: '',
      mediaUrls: [],
      anonymous: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects comment longer than 500 chars', () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: 'a'.repeat(501),
      mediaUrls: [],
      anonymous: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 5 media urls', () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: '',
      mediaUrls: Array(6).fill('https://x.com/a.jpg'),
      anonymous: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid url in mediaUrls', () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: '',
      mediaUrls: ['not-a-url'],
      anonymous: false,
    });
    expect(result.success).toBe(false);
  });

  it('allows empty comment', () => {
    const result = reviewSchema.safeParse({
      rating: 4,
      comment: '',
      mediaUrls: [],
      anonymous: false,
    });
    expect(result.success).toBe(true);
  });

  it('applies default values when fields missing', () => {
    const result = reviewSchema.safeParse({ rating: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBe('');
      expect(result.data.mediaUrls).toEqual([]);
      expect(result.data.anonymous).toBe(false);
    }
  });
});
