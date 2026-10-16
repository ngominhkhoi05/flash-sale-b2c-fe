/**
 * Address Book API (rule features-migration + api-data).
 *
 * Backend endpoints (Swagger 2026-10-14):
 * - GET    /api/v1/users/addresses                       → AddressResponse[]
 * - POST   /api/v1/users/addresses                       body: AddressRequest → AddressResponse
 * - GET    /api/v1/users/addresses/{id}                  → AddressResponse
 * - PUT    /api/v1/users/addresses/{id}                  body: AddressRequest → AddressResponse
 * - DELETE /api/v1/users/addresses/{id}                  → void
 * - PATCH  /api/v1/users/addresses/{id}/default          → AddressResponse
 *
 * Note: backend dùng cùng schema `UpdateAddressRequest` cho cả POST và PUT
 * (xem Swagger `/api/v1/users/addresses` POST). Schema gồm:
 *   contactName, phone, province, district, ward, detailAddress,
 *   latitude, longitude, isDefault (optional).
 */

import { apiFetch } from '@/lib/api';
import { z } from 'zod';

// ─── Response DTO ────────────────────────────────────────────────────────────

/** AddressResponse từ backend. */
export interface AddressResponse {
  id: number;
  contactName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt?: string;
}

// ─── Request DTO ────────────────────────────────────────────────────────────

/** AddressRequest – dùng cho cả POST và PUT. */
export interface AddressRequest {
  contactName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

// ─── Zod schema (client-side validation) ─────────────────────────────────────

const addressPayloadSchema = z.object({
  contactName: z
    .string()
    .min(2, 'Tên người nhận tối thiểu 2 ký tự')
    .max(100, 'Tên người nhận tối đa 100 ký tự'),
  phone: z
    .string()
    .regex(/^(\+?84|0)\d{9}$/, 'Số điện thoại không hợp lệ (vd: 0912345678)'),
  province: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành phố').max(100),
  district: z.string().min(1, 'Vui lòng chọn Quận/Huyện').max(100),
  ward: z.string().min(1, 'Vui lòng chọn Phường/Xã').max(100),
  detailAddress: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ chi tiết')
    .max(255, 'Địa chỉ chi tiết tối đa 255 ký tự'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional(),
});

/** Chuẩn hoá số điện thoại VN về `+84xxxxxxxxx` (theo E.164) trước khi gửi. */
function normalizePhone(raw: string): string {
  const stripped = raw.replace(/^0/, '').replace(/^\+?84/, '');
  return `+84${stripped}`;
}

/**
 * Sanitize payload: convert phone về +84 format, strip undefined fields.
 */
function buildBody(payload: AddressRequest): Record<string, unknown> {
  const parsed = addressPayloadSchema.parse(payload);
  const body: Record<string, unknown> = {
    contactName: parsed.contactName.trim(),
    phone: normalizePhone(parsed.phone),
    province: parsed.province.trim(),
    district: parsed.district.trim(),
    ward: parsed.ward.trim(),
    detailAddress: parsed.detailAddress.trim(),
  };
  if (parsed.latitude !== undefined) body.latitude = parsed.latitude;
  if (parsed.longitude !== undefined) body.longitude = parsed.longitude;
  if (parsed.isDefault !== undefined) body.isDefault = parsed.isDefault;
  return body;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/** GET /api/v1/users/addresses – danh sách địa chỉ (default đầu tiên). */
export async function getAddresses(): Promise<AddressResponse[]> {
  return apiFetch<AddressResponse[]>('/api/v1/users/addresses', {
    method: 'GET',
  });
}

/** POST /api/v1/users/addresses – thêm địa chỉ mới. */
export async function createAddress(
  payload: AddressRequest
): Promise<AddressResponse> {
  return apiFetch<AddressResponse>('/api/v1/users/addresses', {
    method: 'POST',
    json: buildBody(payload),
  });
}

/** GET /api/v1/users/addresses/{id} – chi tiết 1 địa chỉ. */
export async function getAddressById(
  addressId: number
): Promise<AddressResponse> {
  return apiFetch<AddressResponse>(
    `/api/v1/users/addresses/${addressId}`,
    { method: 'GET' }
  );
}

/** PUT /api/v1/users/addresses/{id} – cập nhật địa chỉ. */
export async function updateAddress(
  addressId: number,
  payload: AddressRequest
): Promise<AddressResponse> {
  return apiFetch<AddressResponse>(
    `/api/v1/users/addresses/${addressId}`,
    { method: 'PUT', json: buildBody(payload) }
  );
}

/** DELETE /api/v1/users/addresses/{id} – xoá địa chỉ. */
export async function deleteAddress(addressId: number): Promise<void> {
  await apiFetch<void>(`/api/v1/users/addresses/${addressId}`, {
    method: 'DELETE',
  });
}

/** PATCH /api/v1/users/addresses/{id}/default – đặt làm địa chỉ mặc định. */
export async function setDefaultAddress(
  addressId: number
): Promise<AddressResponse> {
  return apiFetch<AddressResponse>(
    `/api/v1/users/addresses/${addressId}/default`,
    { method: 'PATCH' }
  );
}
