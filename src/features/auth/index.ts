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

// Google OAuth2
export { useGoogleLogin, POPUP_BLOCKED_CODE } from './useGoogleLogin';
export {
  getGoogleConsentUrl,
  loginWithGoogle,
} from './google-api';
export type {
  GoogleConsentUrlResponse,
  GoogleOAuth2LoginRequest,
} from './google-api';
export { applyAuthResponse, POST_LOGIN_INVALIDATE_KEYS, toAuthUser } from './apply-auth-response';
export {
  GOOGLE_CALLBACK_PATH,
  GOOGLE_CONSENT_REDIRECT_URI_KEY,
  extractRedirectUriFromConsentUrl,
  resolveGoogleRedirectUri,
} from './google-redirect-uri';
export type { ResolveGoogleRedirectUriInput } from './google-redirect-uri';
