/**
 * User feature hooks (TanStack Query wrappers).
 *
 * Bao gồm:
 *  - useMeQuery: lấy hồ sơ hiện tại (re-export từ features/auth).
 *  - useUpdateProfile: PUT /api/v1/users/me.
 *  - useChangePassword: PUT /api/v1/users/me/change-password.
 *  - useAddresses, useAddress, useCreateAddress, useUpdateAddress,
 *    useDeleteAddress, useSetDefaultAddress: CRUD địa chỉ.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useMeQuery } from '@/features/auth/hooks';
import {
  updateProfile,
  changePassword,
  type UpdateProfileRequest,
  type UserResponse,
} from './api';
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressRequest,
  type AddressResponse,
} from './addresses';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  addresses: () => [...userKeys.all, 'addresses'] as const,
  address: (id: number) => [...userKeys.addresses(), id] as const,
};

// ─── Profile hooks ──────────────────────────────────────────────────────────

/** Re-export useMeQuery từ features/auth để có entry thống nhất. */
export { useMeQuery };

/**
 * useUpdateProfile – cập nhật hồ sơ.
 * Sau khi thành công: update auth store + invalidate me query.
 */
export function useUpdateProfile(options?: {
  onSuccess?: (user: UserResponse) => void;
  onError?: (error: unknown) => void;
}) {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateProfile(payload),
    onSuccess: (user) => {
      // Cập nhật auth store với thông tin mới (fullName, phone).
      const prev = useAuthStore.getState().user;
      if (prev) {
        setUser({
          ...prev,
          fullName: user.fullName,
        });
      }
      qc.invalidateQueries({ queryKey: userKeys.me() });
      toast.success('Cập nhật hồ sơ thành công');
      options?.onSuccess?.(user);
    },
    onError: (error) => {
      console.error('[user.useUpdateProfile]', error);
      options?.onError?.(error);
    },
  });
}

/**
 * useChangePassword – đổi mật khẩu.
 * Sau khi thành công: KHÔNG tự logout (giữ user đang dùng). Component
 * tự quyết định UX (vd: toast + redirect login).
 */
export function useChangePassword(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  return useMutation({
    mutationFn: (payload: {
      oldPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }) => changePassword(payload),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công');
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error('[user.useChangePassword]', error);
      options?.onError?.(error);
    },
  });
}

// ─── Address hooks ──────────────────────────────────────────────────────────

/** useAddresses – danh sách địa chỉ của user. */
export function useAddresses(
  options?: Omit<UseQueryOptions<AddressResponse[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AddressResponse[]>({
    queryKey: userKeys.addresses(),
    queryFn: () => getAddresses(),
    staleTime: 30_000,
    ...options,
  });
}

/** useAddress – lấy chi tiết 1 địa chỉ (ít dùng; thường dùng useAddresses). */
export function useAddress(
  addressId: number | undefined,
  options?: Omit<UseQueryOptions<AddressResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AddressResponse>({
    queryKey: userKeys.address(addressId ?? 0),
    queryFn: () => {
      if (!addressId) throw new Error('addressId is required');
      return getAddressById(addressId);
    },
    enabled: Boolean(addressId),
    ...options,
  });
}

/** useCreateAddress – thêm địa chỉ mới. */
export function useCreateAddress(options?: {
  onSuccess?: (address: AddressResponse) => void;
  onError?: (error: unknown) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddressRequest) => createAddress(payload),
    onSuccess: (address) => {
      qc.invalidateQueries({ queryKey: userKeys.addresses() });
      toast.success('Thêm địa chỉ thành công');
      options?.onSuccess?.(address);
    },
    onError: (error) => {
      console.error('[user.useCreateAddress]', error);
      options?.onError?.(error);
    },
  });
}

/** useUpdateAddress – sửa địa chỉ. */
export function useUpdateAddress(options?: {
  onSuccess?: (address: AddressResponse) => void;
  onError?: (error: unknown) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      addressId,
      payload,
    }: {
      addressId: number;
      payload: AddressRequest;
    }) => updateAddress(addressId, payload),
    onSuccess: (address, variables) => {
      qc.invalidateQueries({ queryKey: userKeys.addresses() });
      qc.invalidateQueries({ queryKey: userKeys.address(variables.addressId) });
      toast.success('Cập nhật địa chỉ thành công');
      options?.onSuccess?.(address);
    },
    onError: (error) => {
      console.error('[user.useUpdateAddress]', error);
      options?.onError?.(error);
    },
  });
}

/** useDeleteAddress – xoá địa chỉ. */
export function useDeleteAddress(options?: {
  onSuccess?: (addressId: number) => void;
  onError?: (error: unknown) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressId: number) => deleteAddress(addressId),
    onSuccess: (_, addressId) => {
      qc.invalidateQueries({ queryKey: userKeys.addresses() });
      toast.success('Đã xoá địa chỉ');
      options?.onSuccess?.(addressId);
    },
    onError: (error) => {
      console.error('[user.useDeleteAddress]', error);
      options?.onError?.(error);
    },
  });
}

/** useSetDefaultAddress – đặt địa chỉ mặc định. */
export function useSetDefaultAddress(options?: {
  onSuccess?: (address: AddressResponse) => void;
  onError?: (error: unknown) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressId: number) => setDefaultAddress(addressId),
    onSuccess: (address) => {
      qc.invalidateQueries({ queryKey: userKeys.addresses() });
      toast.success('Đã đặt làm địa chỉ mặc định');
      options?.onSuccess?.(address);
    },
    onError: (error) => {
      console.error('[user.useSetDefaultAddress]', error);
      options?.onError?.(error);
    },
  });
}
