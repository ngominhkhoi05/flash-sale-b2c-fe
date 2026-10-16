/**
 * Public surface của feature `user`.
 * Component chỉ import từ "@/features/user".
 */

export {
  fetchMe,
  updateProfile,
  changePassword,
} from './api';
export type {
  UserResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from './api';

export {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './addresses';
export type { AddressResponse, AddressRequest } from './addresses';

export {
  userKeys,
  useMeQuery,
  useUpdateProfile,
  useChangePassword,
  useAddresses,
  useAddress,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from './hooks';
