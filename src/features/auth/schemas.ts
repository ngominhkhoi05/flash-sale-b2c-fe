import { z } from 'zod';
import { passwordSchema } from '@/lib/validators/common';

/**
 * emailSchema – email format theo zod.
 * Backend contract (swagger 2026-10-10): LoginRequest chỉ nhận 1 field
 * `usernameOrEmail` (string, max 100). Backend chấp nhận cả email
 * lẫn phone/username trong cùng 1 field này.
 *
 * Client-side chỉ validate email format (đơn giản nhất cho MVP).
 * Nếu cần phone/username support, đổi thành regex phoneVnSchema.
 */
export const emailSchema = z
  .string()
  .min(1, 'Vui lòng nhập email hoặc số điện thoại')
  .max(100, 'Email quá dài (tối đa 100 ký tự)')
  .email('Email không hợp lệ');

export { passwordSchema };

/**
 * phoneRegisterSchema – số điện thoại VN dùng cho form đăng ký.
 * User nhập số bắt đầu bằng 0 (ví dụ: 0912345678).
 * FE strip leading 0 trước khi gửi API → backend nhận +84...
 */
export const phoneRegisterSchema = z
  .string()
  .min(1, 'Vui lòng nhập số điện thoại')
  .max(11, 'Số điện thoại quá dài')
  .regex(
    /^(0[3-9]\d{8})$/,
    'Số điện thoại không hợp lệ (VD: 0912 345 678)'
  );

/**
 * fullNameSchema – họ và tên (đăng ký).
 * Min 2 ký tự, max 100, cho phép tiếng Việt có dấu + space.
 */
export const fullNameSchema = z
  .string()
  .min(2, 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự)')
  .max(100, 'Họ và tên tối đa 100 ký tự')
  .regex(
    /^[A-Za-zÀ-ỹĂăÂâĐđÊêÔôƠơƯư\s]+$/,
    'Họ và tên chỉ chứa chữ cái và khoảng trắng'
  );

/**
 * passwordRegisterSchema – mật khẩu đăng ký.
 * Yêu cầu Stitch: tối thiểu 8 ký tự, có chữ + số.
 * Bổ sung: max 64 (an toàn với backend bcrypt 72-char limit, tránh DoS).
 */
export const passwordRegisterSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(64, 'Mật khẩu tối đa 64 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu phải có ít nhất 1 chữ cái')
  .regex(/\d/, 'Mật khẩu phải có ít nhất 1 chữ số');

/**
 * loginSchema – dùng trong LoginForm.
 * Field `email` (zod email format) + `password`.
 * Gửi sang backend dưới key `usernameOrEmail` (xem api.ts).
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * registerSchema – dùng trong RegisterForm.
 * Stitch screen 0f04994fa0a... (Đăng ký tài khoản):
 *  - fullName: 2-100 ký tự, chỉ chữ + space
 *  - email: email format
 *  - phone: 9 chữ số VN (prefix +84 hiển thị ngoài form)
 *  - password: 8-64, có chữ + số
 *  - confirmPassword: phải bằng password
 *
 * Lưu ý: `agreedTerms` KHÔNG nằm trong schema vì ta validate riêng
 * trong onSubmit bằng toast (RHF gọi onSubmit khi form hợp lệ,
 * không phải khi schema lỗi).
 */
export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneRegisterSchema,
  password: passwordRegisterSchema,
  confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * otpCodeSchema – mã OTP 6 chữ số (dùng cho xác thực email).
 * Rule: chính xác 6 ký tự, chỉ chứa chữ số 0-9.
 */
export const otpCodeSchema = z
  .string()
  .min(6, 'Mã xác thực phải có 6 chữ số')
  .max(6, 'Mã xác thực phải có 6 chữ số')
  .regex(/^\d{6}$/, 'Mã xác thực chỉ chứa chữ số');

/**
 * verifyOtpSchema – form xác thực email (Stitch screen 26dbd4cd7e7f47c68d509c58a44cb083).
 * Field: code (6 số).
 */
export const verifyOtpSchema = z.object({
  code: otpCodeSchema,
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
