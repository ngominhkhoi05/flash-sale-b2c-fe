/**
 * Public surface của feature `auth`.
 * Component chỉ import từ "@/features/auth".
 */
export {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useMeQuery,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from './hooks';
export type {
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  AuthResponse,
  UserResponse,
  AuthUserDto,
  LoginInput,
  RegisterInput,
} from './types';
export {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  otpCodeSchema,
  emailSchema,
  passwordSchema,
  fullNameSchema,
  phoneRegisterSchema,
  passwordRegisterSchema,
} from './schemas';
export type { VerifyOtpInput } from './schemas';
export { MOCK_OTP_CODE, MOCK_OTP_TTL_MS, MOCK_OTP_MAX_ATTEMPTS } from './mocks';
