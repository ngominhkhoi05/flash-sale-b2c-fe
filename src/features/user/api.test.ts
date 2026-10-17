/**
 * Tests cho user profile + address API layer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AddressResponse, AddressRequest } from './addresses';
import type { UserResponse } from './api';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import { apiFetch } from '@/lib/api';
import {
  updateProfile,
  changePassword,
} from './api';
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './addresses';
import { updateProfile as updateProfileExport } from './index';

const mockedApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// updateProfile
// ─────────────────────────────────────────────────────────────────────────────

describe('updateProfile', () => {
  it('PUTs /api/v1/users/me with normalized phone (+84 prefix)', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      id: 1,
      email: 'u@e.com',
      fullName: 'Nguyễn Văn A',
      phone: '+84912345678',
      avatarUrl: null,
      status: 'ACTIVE',
      createdAt: '2026-10-14T00:00:00Z',
    });
    const res = await updateProfile({
      fullName: 'Nguyễn Văn A',
      phone: '0912345678',
    });
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/v1/users/me', {
      method: 'PUT',
      json: {
        fullName: 'Nguyễn Văn A',
        phone: '+84912345678',
      },
    });
    expect(res.fullName).toBe('Nguyễn Văn A');
  });

  it('omits phone field when not provided', async () => {
    mockedApiFetch.mockResolvedValueOnce({} as Partial<UserResponse>);
    await updateProfile({ fullName: 'An' });
    const call = mockedApiFetch.mock.calls[0]?.[1] as { json: Record<string, unknown> };
    expect(call.json).toEqual({ fullName: 'An' });
    expect(call.json).not.toHaveProperty('phone');
  });

  it('rejects empty fullName (does not call API)', async () => {
    await expect(updateProfile({ fullName: '' })).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});

describe('changePassword', () => {
  it('PUTs /api/v1/users/me/change-password with { oldPassword, newPassword }', async () => {
    mockedApiFetch.mockResolvedValueOnce(undefined);
    await changePassword({
      oldPassword: 'oldPass123',
      newPassword: 'newPass456',
      confirmNewPassword: 'newPass456',
    });
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/api/v1/users/me/change-password',
      {
        method: 'PUT',
        json: { oldPassword: 'oldPass123', newPassword: 'newPass456' },
      }
    );
  });

  it('rejects when newPassword !== confirmNewPassword', async () => {
    await expect(
      changePassword({
        oldPassword: 'oldPass123',
        newPassword: 'newPass456',
        confirmNewPassword: 'different',
      })
    ).rejects.toThrow(/Mật khẩu xác nhận không khớp/);
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('rejects when newPassword === oldPassword', async () => {
    await expect(
      changePassword({
        oldPassword: 'samePass1',
        newPassword: 'samePass1',
        confirmNewPassword: 'samePass1',
      })
    ).rejects.toThrow(/Mật khẩu mới phải khác mật khẩu hiện tại/);
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('rejects when newPassword shorter than 6 chars', async () => {
    await expect(
      changePassword({
        oldPassword: 'oldPass1',
        newPassword: 'abc',
        confirmNewPassword: 'abc',
      })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Addresses
// ─────────────────────────────────────────────────────────────────────────────

describe('getAddresses', () => {
  it('GETs /api/v1/users/addresses', async () => {
    const mock: AddressResponse[] = [
      {
        id: 1,
        contactName: 'A',
        phone: '+84912345678',
        province: 'HCM',
        district: 'Q1',
        ward: 'Bến Nghé',
        detailAddress: '12 Nguyễn Huệ',
        latitude: null,
        longitude: null,
        isDefault: true,
      },
    ];
    mockedApiFetch.mockResolvedValueOnce(mock);
    const res = await getAddresses();
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/v1/users/addresses', {
      method: 'GET',
    });
    expect(res).toHaveLength(1);
  });
});

describe('createAddress', () => {
  it('POSTs /api/v1/users/addresses with normalized phone +84', async () => {
    const payload: AddressRequest = {
      contactName: 'Nguyễn Văn A',
      phone: '0912345678',
      province: 'HCM',
      district: 'Q1',
      ward: 'Bến Nghé',
      detailAddress: '12 Nguyễn Huệ',
    };
    mockedApiFetch.mockResolvedValueOnce({ id: 1, ...payload, isDefault: false });
    await createAddress(payload);
    const call = mockedApiFetch.mock.calls[0]?.[1] as { json: Record<string, unknown> };
    expect(call.json.phone).toBe('+84912345678');
    expect(call.json).not.toHaveProperty('isDefault');
  });

  it('strips undefined optional fields (latitude/longitude/isDefault)', async () => {
    mockedApiFetch.mockResolvedValueOnce({ id: 1 } as Partial<AddressResponse>);
    await createAddress({
      contactName: 'An',
      phone: '0912345678',
      province: 'HCM',
      district: 'Q1',
      ward: 'Bến Nghé',
      detailAddress: '12',
      isDefault: true,
    });
    const call = mockedApiFetch.mock.calls[0]?.[1] as { json: Record<string, unknown> };
    expect(call.json.isDefault).toBe(true);
    expect(call.json).not.toHaveProperty('latitude');
    expect(call.json).not.toHaveProperty('longitude');
  });

  it('rejects invalid phone format', async () => {
    await expect(
      createAddress({
        contactName: 'A',
        phone: 'abc',
        province: 'HCM',
        district: 'Q1',
        ward: 'Bến Nghé',
        detailAddress: '12',
      })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('rejects empty detailAddress', async () => {
    await expect(
      createAddress({
        contactName: 'A',
        phone: '0912345678',
        province: 'HCM',
        district: 'Q1',
        ward: 'Bến Nghé',
        detailAddress: '',
      })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});

describe('getAddressById', () => {
  it('GETs /api/v1/users/addresses/{id}', async () => {
    mockedApiFetch.mockResolvedValueOnce({ id: 5, isDefault: false } as Partial<AddressResponse>);
    await getAddressById(5);
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/v1/users/addresses/5', {
      method: 'GET',
    });
  });
});

describe('updateAddress', () => {
  it('PUTs /api/v1/users/addresses/{id} with body', async () => {
    mockedApiFetch.mockResolvedValueOnce({ id: 5 } as Partial<AddressResponse>);
    await updateAddress(5, {
      contactName: 'An',
      phone: '0912345678',
      province: 'HCM',
      district: 'Q1',
      ward: 'Bến Nghé',
      detailAddress: '12',
    });
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/api/v1/users/addresses/5',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

describe('deleteAddress', () => {
  it('DELETEs /api/v1/users/addresses/{id}', async () => {
    mockedApiFetch.mockResolvedValueOnce(undefined);
    await deleteAddress(5);
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/api/v1/users/addresses/5',
      { method: 'DELETE' }
    );
  });
});

describe('setDefaultAddress', () => {
  it('PATCHes /api/v1/users/addresses/{id}/default', async () => {
    mockedApiFetch.mockResolvedValueOnce({ id: 5, isDefault: true } as Partial<AddressResponse>);
    await setDefaultAddress(5);
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/api/v1/users/addresses/5/default',
      { method: 'PATCH' }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Public re-export
// ─────────────────────────────────────────────────────────────────────────────

describe('feature/user index public surface', () => {
  it('re-exports updateProfile', () => {
    expect(updateProfileExport).toBe(updateProfile);
  });
});
