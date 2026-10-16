import { z } from 'zod';

/**
 * Review form schema.
 *
 * - rating: 1..5 (số nguyên)
 * - comment: 0..500 ký tự (optional, có thể rỗng — UI chỉ bonus cho >50 từ + ảnh)
 * - mediaUrls: 0..5 URL ảnh/video
 * - anonymous: ẩn tên tài khoản khi hiển thị
 */
export const reviewSchema = z.object({
  rating: z
    .number()
    .int('Số sao phải là số nguyên')
    .min(1, 'Vui lòng chọn ít nhất 1 sao')
    .max(5, 'Tối đa 5 sao'),
  comment: z
    .string()
    .max(500, 'Nhận xét tối đa 500 ký tự')
    .default(''),
  mediaUrls: z
    .array(z.string().url('URL ảnh/video không hợp lệ'))
    .max(5, 'Tối đa 5 ảnh/video')
    .default([]),
  anonymous: z.boolean().default(false),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
