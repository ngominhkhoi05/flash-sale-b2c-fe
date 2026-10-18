"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import type { AddressResponse, AddressRequest } from "../addresses";
import {
  PROVINCE_NAMES,
  getDistrictsByProvince,
  getWardsByDistrict,
} from "@/lib/constants/vietnam-locations";

interface AddressDialogProps {
  open: boolean;
  initialData?: AddressResponse | null;
  onClose: () => void;
  onSubmit: (data: AddressRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// Regex số điện thoại di động Việt Nam 10 chữ số: đầu 03, 05, 07, 08, 09 (hoặc +84)
const VN_PHONE_REGEX = /^(0|(\+84))(3|5|7|8|9)[0-9]{8}$/;

export function AddressDialog({
  open,
  initialData,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddressDialogProps) {
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState(PROVINCE_NAMES[0]);
  const [district, setDistrict] = useState(() => getDistrictsByProvince(PROVINCE_NAMES[0])[0] || "");
  const [ward, setWard] = useState(() => getWardsByDistrict(PROVINCE_NAMES[0], getDistrictsByProvince(PROVINCE_NAMES[0])[0])[0] || "");
  const [detailAddress, setDetailAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 10.8231,
    lng: 106.6297,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const districts = getDistrictsByProvince(newProv);
    const firstDistrict = districts[0] || "";
    setDistrict(firstDistrict);
    const wards = getWardsByDistrict(newProv, firstDistrict);
    setWard(wards[0] || "");
    if (errors.province) setErrors((prev) => ({ ...prev, province: "" }));
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const wards = getWardsByDistrict(province, newDist);
    setWard(wards[0] || "");
    if (errors.district) setErrors((prev) => ({ ...prev, district: "" }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrors({});
      if (initialData) {
        setContactName(initialData.contactName || "");
        setPhone(initialData.phone?.replace(/^\+84/, "0") || "");
        const prov = initialData.province || "Hồ Chí Minh";
        setProvince(prov);
        const dist = initialData.district || getDistrictsByProvince(prov)[0] || "";
        setDistrict(dist);
        const w = initialData.ward || getWardsByDistrict(prov, dist)[0] || "";
        setWard(w);
        setDetailAddress(initialData.detailAddress || "");
        setIsDefault(Boolean(initialData.isDefault));
        if (initialData.latitude && initialData.longitude) {
          setCoordinates({ lat: initialData.latitude, lng: initialData.longitude });
        }
      } else {
        setContactName("");
        setPhone("");
        setProvince("Hồ Chí Minh");
        const dist = getDistrictsByProvince("Hồ Chí Minh")[0] || "";
        setDistrict(dist);
        const w = getWardsByDistrict("Hồ Chí Minh", dist)[0] || "";
        setWard(w);
        setDetailAddress("");
        setIsDefault(false);
        setCoordinates({ lat: 10.8446, lng: 106.7976 });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [initialData, open]);

  if (!open) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị GPS");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
        });
        setIsLocating(false);
        toast.success("Đã lấy tọa độ GPS thành công");
      },
      () => {
        setIsLocating(false);
        toast.error("Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền định vị.");
      }
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!contactName.trim()) {
      errs.contactName = "Vui lòng nhập họ và tên người nhận";
    } else if (contactName.trim().length < 2) {
      errs.contactName = "Họ và tên tối thiểu 2 ký tự";
    }

    const cleanPhone = phone.trim().replace(/[\s\-\.]/g, "");
    if (!cleanPhone) {
      errs.phone = "Vui lòng nhập số điện thoại";
    } else if (!VN_PHONE_REGEX.test(cleanPhone)) {
      errs.phone = "Số điện thoại không hợp lệ (phải gồm 10 chữ số, ví dụ: 0912345678)";
    }

    if (!province.trim()) {
      errs.province = "Vui lòng chọn Tỉnh/Thành phố";
    }
    if (!district.trim()) {
      errs.district = "Vui lòng chọn Quận/Huyện";
    }
    if (!ward.trim()) {
      errs.ward = "Vui lòng chọn Phường/Xã";
    }

    if (!detailAddress.trim()) {
      errs.detailAddress = "Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        contactName: contactName.trim(),
        phone: phone.trim().replace(/[\s\-\.]/g, ""),
        province,
        district,
        ward,
        detailAddress: detailAddress.trim(),
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        isDefault,
      });
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      let cleanMsg = rawMsg;
      if (rawMsg.startsWith("[") && rawMsg.includes('"message"')) {
        try {
          const parsed = JSON.parse(rawMsg);
          if (Array.isArray(parsed) && parsed[0]?.message) {
            cleanMsg = parsed[0].message;
          }
        } catch {}
      }
      toast.error(cleanMsg || "Không thể lưu địa chỉ. Vui lòng kiểm tra lại thông tin.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
      <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-outline-variant/30">
        <header className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-5">
          <h3 className="text-lg font-bold text-on-surface">
            {initialData ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <MaterialSymbol name="close" size="[18px]" />
          </button>
        </header>

        <form onSubmit={handleSubmitForm} className="space-y-4" noValidate>
          {/* Row 1: Tên & SĐT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface">
                Họ và tên <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  if (errors.contactName) setErrors((prev) => ({ ...prev, contactName: "" }));
                }}
                placeholder="Nguyễn Văn An"
                className={cn(
                  "w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-sm border transition-colors focus:outline-none focus:ring-2",
                  errors.contactName
                    ? "border-error focus:ring-error/20"
                    : "border-outline-variant focus:ring-primary/20 focus:border-primary"
                )}
              />
              {errors.contactName && (
                <p className="text-[11px] text-error font-medium mt-1 flex items-center gap-1">
                  <MaterialSymbol name="error" size="[14px]" />
                  <span>{errors.contactName}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface">
                Số điện thoại <span className="text-error">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                placeholder="0912345678"
                className={cn(
                  "w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-sm border transition-colors focus:outline-none focus:ring-2",
                  errors.phone
                    ? "border-error focus:ring-error/20"
                    : "border-outline-variant focus:ring-primary/20 focus:border-primary"
                )}
              />
              {errors.phone && (
                <p className="text-[11px] text-error font-medium mt-1 flex items-center gap-1">
                  <MaterialSymbol name="error" size="[14px]" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 2: 3 Dropdowns Tỉnh/Quận/Phường (Cascade Selects) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface">
                Tỉnh / Thành phố <span className="text-error">*</span>
              </label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                {PROVINCE_NAMES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.province && (
                <p className="text-[11px] text-error font-medium mt-1">{errors.province}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface">
                Quận / Huyện <span className="text-error">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                {getDistrictsByProvince(province).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="text-[11px] text-error font-medium mt-1">{errors.district}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface">
                Phường / Xã <span className="text-error">*</span>
              </label>
              <select
                value={ward}
                onChange={(e) => {
                  setWard(e.target.value);
                  if (errors.ward) setErrors((prev) => ({ ...prev, ward: "" }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                {getWardsByDistrict(province, district).map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              {errors.ward && (
                <p className="text-[11px] text-error font-medium mt-1">{errors.ward}</p>
              )}
            </div>
          </div>

          {/* Row 3: Địa chỉ cụ thể */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface">
              Địa chỉ cụ thể <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={detailAddress}
              onChange={(e) => {
                setDetailAddress(e.target.value);
                if (errors.detailAddress) setErrors((prev) => ({ ...prev, detailAddress: "" }));
              }}
              placeholder="Số nhà, tên đường, tòa nhà..."
              className={cn(
                "w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-sm border transition-colors focus:outline-none focus:ring-2",
                errors.detailAddress
                  ? "border-error focus:ring-error/20"
                  : "border-outline-variant focus:ring-primary/20 focus:border-primary"
              )}
            />
            {errors.detailAddress && (
              <p className="text-[11px] text-error font-medium mt-1 flex items-center gap-1">
                <MaterialSymbol name="error" size="[14px]" />
                <span>{errors.detailAddress}</span>
              </p>
            )}
          </div>

          {/* Row 4: Bản đồ GPS Picker */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <MaterialSymbol name="map" size="[16px]" className="text-primary" />
                <span>Vị trí trên bản đồ (GPS)</span>
              </label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <MaterialSymbol name="my_location" size="[14px]" />
                <span>{isLocating ? "Đang định vị..." : "Dùng vị trí hiện tại"}</span>
              </button>
            </div>

            <div
              className="relative w-full h-28 rounded-2xl bg-surface-container border border-outline-variant/40 overflow-hidden flex items-center justify-center cursor-crosshair group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
                const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
                setCoordinates((prev) => ({
                  lat: Number((prev.lat - yRatio * 0.05).toFixed(4)),
                  lng: Number((prev.lng + xRatio * 0.05).toFixed(4)),
                }));
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
              <div className="flex flex-col items-center gap-1 text-primary animate-bounce">
                <MaterialSymbol name="location_on" size="[28px]" fill />
                <span className="font-mono text-[10px] bg-surface-container-lowest/90 px-2 py-0.5 rounded shadow-xs border border-outline-variant/30 text-on-surface font-semibold">
                  {coordinates.lat}, {coordinates.lng}
                </span>
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] text-on-surface-variant bg-surface-container-lowest/80 px-2 py-0.5 rounded-full pointer-events-none">
                Nhấp để ghim vị trí giao hàng
              </div>
            </div>
          </div>

          {/* Row 5: Đặt làm mặc định */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary"
              />
              <span className="text-xs text-on-surface">Đặt làm địa chỉ mặc định</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl text-xs font-bold text-on-primary bg-primary hover:bg-primary/90 shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Hoàn thành</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
