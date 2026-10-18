/**
 * User Profile API (rule features-migration + api-data).
 *
 * Backend endpoints (Swagger 2026-10-14):
 * - GET  /api/v1/users/me                 → UserResponse
 * - PUT  /api/v1/users/me                 body: { fullName, phone? } → UserResponse
 * - PUT  /api/v1/users/me/change-password body: { oldPassword, newPassword } → void
 *
 * Note: backend `UserResponse` (theo OpenAPI) chứa:
 *   id, email, fullName, phone, avatarUrl, status, createdAt, roles
 * (Role lấy từ JWT authorities – field `roles` mới được thêm ở schema
 * mới nhưng client vẫn ưu tiên đọc từ JWT để tránh trường hợp token
 * cũ chưa có claim.)
 */

import { apiFetch } from '@/lib/api';
import { z } from 'zod';
import {
  fullNameSchema,
  phoneRegisterSchema,
  passwordSchema,
} from '@/features/auth/schemas';

/** UserResponse từ backend (đầy đủ field mới nhất). */
export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | string;
  createdAt: string; // ISO 8601
  /** Thêm trong schema mới: danh sách role code (vd ["ROLE_BUYER"]).
   * Optional – schema cũ chưa có field này. */
  roles?: string[];
}

/** Request body cho PUT /api/v1/users/me. */
export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
}

/** Request body cho PUT /api/v1/users/me/change-password. */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ─── Zod schemas (client-side validation) ────────────────────────────────────

const updateProfilePayloadSchema = z.object({
  fullName: fullNameSchema,
  phone: z
    .string()
    .trim()
    .refine((v) => !v || /^(\+?84|0)\d{9}$/.test(v), {
      message: 'Số điện thoại không hợp lệ (VD: 0912345678)',
    })
    .optional(),
});

const changePasswordPayloadSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Mật khẩu xác nhận không khớp',
  })
  .refine((v) => v.newPassword !== v.oldPassword, {
    path: ['newPassword'],
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
  });

/**
 * fetchMe – GET /api/v1/users/me.
 * Re-export từ features/auth (đã tồn tại ở đó) cho callers
 * cần dùng từ context user profile. Cùng endpoint, cùng DTO.
 */
export { fetchMe } from '@/features/auth/api';

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * updateProfile – PUT /api/v1/users/me.
 *
 * Cập nhật fullName (bắt buộc) và phone (tùy chọn).
 * Phone ở backend nhận format E.164 (`+84xxxxxxxxx`); client gửi
 * raw 9 chữ số (đã strip leading 0 từ form) kèm `+84` prefix.
 */
export async function updateProfile(
  payload: UpdateProfileRequest
): Promise<UserResponse> {
  const parsed = updateProfilePayloadSchema.parse(payload);
  const body: { fullName: string; phone?: string } = {
    fullName: parsed.fullName,
  };
  if (parsed.phone && parsed.phone.trim()) {
    const cleanPhone = parsed.phone.trim().replace(/^0/, '').replace(/^\+84/, '');
    body.phone = `+84${cleanPhone}`;
  }
  return apiFetch<UserResponse>('/api/v1/users/me', {
    method: 'PUT',
    json: body,
  });
}

/**
 * changePassword – PUT /api/v1/users/me/change-password.
 *
 * Validate client-side (confirm match, new ≠ old) trước khi gọi API.
 * Backend trả ApiResponseVoid (apiFetch sẽ trả undefined).
 */
export async function changePassword(
  payload: { oldPassword: string; newPassword: string; confirmNewPassword: string }
): Promise<void> {
  const parsed = changePasswordPayloadSchema.parse(payload);
  await apiFetch<void>('/api/v1/users/me/change-password', {
    method: 'PUT',
    json: {
      oldPassword: parsed.oldPassword,
      newPassword: parsed.newPassword,
    },
  });
}
