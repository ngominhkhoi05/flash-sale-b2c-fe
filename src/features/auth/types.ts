/**
 * Public types của feature `auth`.
 * Re-export từ `api.ts` cho component dùng gọn.
 */
export type {
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  AuthResponse,
  UserResponse,
  AuthUserDto,
} from './api';
export type { LoginInput, RegisterInput, VerifyOtpInput } from './schemas';
