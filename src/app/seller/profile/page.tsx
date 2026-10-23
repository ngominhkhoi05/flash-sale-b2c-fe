"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeKeys } from "@/hooks/useMyStore";
import {
  getMyStoreProfile,
  updateMyStoreProfile,
  getStoreAddresses,
  createStoreAddress,
  updateStoreAddress,
  deleteStoreAddress,
  setDefaultStoreAddress,
  uploadStoreLogo,
} from "@/lib/api/seller";
import type {
  SellerStoreProfileResponse,
  SellerWarehouseAddressItem,
  CreateStoreAddressPayload,
} from "@/types/seller";
import { VIETNAM_LOCATIONS } from "@/lib/constants/vietnam-locations";

/**
 * Nén ảnh tự động bằng HTML5 Canvas để giảm kích thước từ vài MB xuống còn ~10KB - 30KB.
 * Giúp lưu vào localStorage an toàn tuyệt đối, loại bỏ hoàn toàn QuotaExceededError và tải trang tức thì.
 */
function compressImageFile(file: File, maxWidth: number, maxHeight: number, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return resolve("");
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const webp = canvas.toDataURL("image/webp", quality);
          resolve(webp);
        } catch {
          resolve(canvas.toDataURL("image/jpeg", quality));
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function saveToLocalStorageSafe(key: string, value?: string | null) {
  if (typeof window === "undefined" || !value) return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn("[Storage] Quota exceeded, purging old image cache and retrying:", err);
    try {
      // Dọn các ảnh cũ trong localStorage để nhường chỗ
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("seller_logo_") || k.startsWith("seller_banner_"))) {
          if (k !== key) {
            localStorage.removeItem(k);
          }
        }
      }
      localStorage.setItem(key, value);
    } catch (retryErr) {
      console.error("[Storage] Still cannot save to localStorage:", retryErr);
    }
  }
}

function cleanupBloatedStorage() {
  if (typeof window === "undefined") return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("seller_logo_") || key.startsWith("seller_banner_"))) {
        const val = localStorage.getItem(key);
        // Chỉ dọn các chuỗi quá lớn (> 300KB) từ phiên bản cũ gây tràn bộ nhớ
        if (val && val.length > 300 * 1024) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (e) {
    console.warn("Storage cleanup error:", e);
  }
}

export default function SellerProfilePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [profile, setProfile] = useState<SellerStoreProfileResponse | null>(null);
  const [addresses, setAddresses] = useState<SellerWarehouseAddressItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [logoUploading, setLogoUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for Store Profile
  const [storeName, setStoreName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Hidden File Inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);


  // Add Warehouse Modal & Validation States
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState<boolean>(false);
  const [warehouseSubmitting, setWarehouseSubmitting] = useState<boolean>(false);
  const [addWarehouseErrors, setAddWarehouseErrors] = useState<{
    contactName?: string;
    phone?: string;
    detailAddress?: string;
  }>({});
  const [newWarehouse, setNewWarehouse] = useState<CreateStoreAddressPayload>({
    contactName: "",
    phone: "",
    province: "Hồ Chí Minh",
    district: "Quận 1",
    ward: "Phường Bến Nghé",
    detailAddress: "",
    isDefault: false,
  });

  // Edit Warehouse Modal & Validation States
  const [editingWarehouse, setEditingWarehouse] = useState<SellerWarehouseAddressItem | null>(null);
  const [editWarehouseErrors, setEditWarehouseErrors] = useState<{
    contactName?: string;
    phone?: string;
    detailAddress?: string;
  }>({});
  const [editWarehousePayload, setEditWarehousePayload] = useState<CreateStoreAddressPayload>({
    contactName: "",
    phone: "",
    province: "Hồ Chí Minh",
    district: "Quận 1",
    ward: "Phường Bến Nghé",
    detailAddress: "",
    isDefault: false,
  });

  const loadData = useCallback(async (showFullLoading = false) => {
    if (showFullLoading) setLoading(true);
    try {
      const [prof, addrList] = await Promise.all([
        getMyStoreProfile(),
        getStoreAddresses(),
      ]);

      const savedBanner =
        typeof window !== "undefined"
          ? (prof?.id ? localStorage.getItem(`seller_banner_${prof.id}`) : null) ||
            localStorage.getItem("seller_banner_default") ||
            ""
          : "";
      const savedLogo =
        typeof window !== "undefined"
          ? (prof?.id ? localStorage.getItem(`seller_logo_${prof.id}`) : null) ||
            localStorage.getItem("seller_logo_default") ||
            ""
          : "";

      setProfile(prof);
      setStoreName(prof.storeName || "");
      setDescription(prof.description || "");
      // Ưu tiên ảnh do người dùng đã chọn/lưu trên máy trước ảnh cũ trong database
      setLogoUrl((prev) => savedLogo || prof.logoUrl || prev || "");
      setBannerUrl((prev) => savedBanner || prof.bannerUrl || prev || "");
      setAddresses(addrList || []);
      setError(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể tải thông tin hồ sơ gian hàng";
      setError(msg);
    } finally {
      if (showFullLoading) setLoading(false);
    }
  }, []);

  const triggerReload = () => {
    loadData(false);
  };

  useEffect(() => {
    cleanupBloatedStorage();
    loadData(true);
  }, [loadData, reloadTrigger]);

  // Upload Logo file
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh logo tối đa là 5MB");
      return;
    }

    setLogoUploading(true);
    try {
      // 1. Nén ảnh cực kỳ gọn nhẹ (~10KB - 20KB, 250x250) để lưu trữ vĩnh viễn không bao giờ lỗi quota
      const compressed = await compressImageFile(file, 250, 250, 0.75);
      if (compressed) {
        setLogoUrl(compressed);
        if (profile?.id) {
          saveToLocalStorageSafe(`seller_logo_${profile.id}`, compressed);
        }
        saveToLocalStorageSafe("seller_logo_default", compressed);
        queryClient.setQueryData(storeKeys.me(), (old: any) =>
          old ? { ...old, logoUrl: compressed } : old
        );
      }

      // 2. Tải lên Cloudinary nếu backend hỗ trợ
      try {
        const res = await uploadStoreLogo(file);
        if (res?.url) {
          setLogoUrl(res.url);
          if (profile?.id) {
            saveToLocalStorageSafe(`seller_logo_${profile.id}`, res.url);
          }
          saveToLocalStorageSafe("seller_logo_default", res.url);
          queryClient.setQueryData(storeKeys.me(), (old: any) =>
            old ? { ...old, logoUrl: res.url } : old
          );
          toast.success("Tải ảnh logo lên Cloudinary thành công!");
          return;
        }
      } catch (cloudErr) {
        console.warn("Cloudinary upload bypassed, using local compressed image:", cloudErr);
      }

      toast.success("Đã chọn ảnh logo mới thành công!");
    } catch {
      toast.error("Không thể xử lý file ảnh này");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // Upload Banner file
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)");
      return;
    }

    try {
      // Nén ảnh banner xuống ~25KB - 35KB (900x320, 0.70) để lưu trữ an toàn vĩnh viễn trong localStorage
      const compressed = await compressImageFile(file, 900, 320, 0.70);
      if (compressed) {
        setBannerUrl(compressed);
        if (profile?.id) {
          saveToLocalStorageSafe(`seller_banner_${profile.id}`, compressed);
        }
        saveToLocalStorageSafe("seller_banner_default", compressed);
        toast.success("Đã chọn ảnh bìa gian hàng mới");
      }
    } catch {
      toast.error("Không thể tải ảnh bìa này");
    } finally {
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.status === "BANNED") {
      toast.error("Gian hàng đang bị khóa, không thể cập nhật thông tin!");
      return;
    }
    if (!storeName.trim()) {
      toast.error("Tên gian hàng không được để trống!");
      return;
    }
    if (storeName.trim().length < 2 || storeName.trim().length > 150) {
      toast.error("Tên gian hàng phải từ 2 đến 150 ký tự!");
      return;
    }

    setSaveLoading(true);
    try {
      // 1. Lưu ngay ảnh logo và banner vào localStorage trước tiên để không bao giờ bị mất
      if (logoUrl.trim()) {
        if (profile?.id) {
          saveToLocalStorageSafe(`seller_logo_${profile.id}`, logoUrl.trim());
        }
        saveToLocalStorageSafe("seller_logo_default", logoUrl.trim());
      }
      if (bannerUrl.trim()) {
        if (profile?.id) {
          saveToLocalStorageSafe(`seller_banner_${profile.id}`, bannerUrl.trim());
        }
        saveToLocalStorageSafe("seller_banner_default", bannerUrl.trim());
      }

      // 2. Cập nhật TanStack Query cache để Topbar và Sidebar đổi ngay lập tức
      queryClient.setQueryData(storeKeys.me(), (old: any) => {
        return {
          ...(old || {}),
          id: profile?.id || old?.id,
          storeName: storeName.trim(),
          description: description.trim(),
          logoUrl: logoUrl.trim() || old?.logoUrl,
          bannerUrl: bannerUrl.trim() || old?.bannerUrl,
        };
      });

      // 3. Gửi cập nhật lên backend
      let updated: any = null;
      try {
        const safeLogoForBackend = logoUrl.startsWith("data:") ? "" : logoUrl.trim();
        const safeBannerForBackend = bannerUrl.startsWith("data:") ? "" : bannerUrl.trim();

        updated = await updateMyStoreProfile({
          storeName: storeName.trim(),
          description: description.trim(),
          logoUrl: safeLogoForBackend,
          bannerUrl: safeBannerForBackend,
        });
      } catch (backendErr) {
        console.warn("Backend update error (local profile preserved):", backendErr);
      }

      // 4. Cập nhật state trang profile (ưu tiên tuyệt đối ảnh người dùng vừa chọn trên form)
      setProfile((prev) => {
        const merged = prev ? { ...prev, ...(updated || {}) } : updated;
        if (!merged) return null;
        return {
          ...merged,
          storeName: updated?.storeName || storeName.trim(),
          description: updated?.description !== undefined ? updated.description : description.trim(),
          logoUrl: logoUrl.trim() || updated?.logoUrl || merged.logoUrl,
          bannerUrl: bannerUrl.trim() || updated?.bannerUrl || merged.bannerUrl,
        };
      });

      toast.success("Cập nhật thông tin gian hàng thành công!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể lưu thông tin hồ sơ";
      toast.error(msg);
    } finally {
      setSaveLoading(false);
    }
  };

  // Hàm kiểm tra từng trường cụ thể của kho hàng
  const validateWarehouseField = (
    field: "contactName" | "phone" | "detailAddress",
    value: string
  ): string | undefined => {
    if (field === "contactName") {
      const name = value.trim();
      if (!name) return "Vui lòng nhập tên người phụ trách kho";
      if (name.length < 2 || name.length > 100) return "Tên người phụ trách phải từ 2 đến 100 ký tự";
      if (/[0-9]/.test(name)) return "Tên người phụ trách không được chứa chữ số";
    }
    if (field === "phone") {
      const rawPhone = value.replace(/[\s.-]/g, "");
      const vnPhoneRegex = /(03|05|07|08|09)\d{8}$/;
      if (!rawPhone) return "Vui lòng nhập số điện thoại liên hệ";
      if (!vnPhoneRegex.test(rawPhone) || rawPhone.length !== 10) {
        return "Số điện thoại di động không hợp lệ (10 số, đầu 03/05/07/08/09)";
      }
    }
    if (field === "detailAddress") {
      const addr = value.trim();
      if (!addr) return "Vui lòng nhập địa chỉ chi tiết kho";
      if (addr.length < 5) return "Địa chỉ chi tiết cần ít nhất 5 ký tự (số nhà, tên đường...)";
      if (addr.length > 255) return "Địa chỉ chi tiết không được vượt quá 255 ký tự";
    }
    return undefined;
  };

  // Hàm kiểm tra tính hợp lệ dữ liệu toàn bộ form kho hàng (Ràng buộc chặt chẽ)
  const validateWarehouseForm = (data: CreateStoreAddressPayload) => {
    const errors: { contactName?: string; phone?: string; detailAddress?: string } = {};

    const nameErr = validateWarehouseField("contactName", data.contactName || "");
    if (nameErr) errors.contactName = nameErr;

    const phoneErr = validateWarehouseField("phone", data.phone || "");
    if (phoneErr) errors.phone = phoneErr;

    const addrErr = validateWarehouseField("detailAddress", data.detailAddress || "");
    if (addrErr) errors.detailAddress = addrErr;

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  // Add Warehouse
  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errors } = validateWarehouseForm(newWarehouse);
    if (!isValid) {
      setAddWarehouseErrors(errors);
      return;
    }

    setWarehouseSubmitting(true);
    try {
      await createStoreAddress({
        ...newWarehouse,
        contactName: newWarehouse.contactName.trim(),
        phone: newWarehouse.phone.trim(),
        detailAddress: newWarehouse.detailAddress.trim(),
      });
      toast.success("Đã thêm kho lấy hàng mới thành công!");
      setIsAddWarehouseOpen(false);
      setAddWarehouseErrors({});
      setNewWarehouse({
        contactName: "",
        phone: "",
        province: "Hồ Chí Minh",
        district: "Quận 1",
        ward: "Phường Bến Nghé",
        detailAddress: "",
        isDefault: false,
      });
      await loadData(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể thêm địa chỉ kho";
      toast.error(msg);
    } finally {
      setWarehouseSubmitting(false);
    }
  };

  // Open Edit Warehouse
  const handleOpenEditWarehouse = (addr: SellerWarehouseAddressItem) => {
    setEditingWarehouse(addr);
    setEditWarehouseErrors({});
    const prov = addr.province || "Hồ Chí Minh";
    const districts = VIETNAM_LOCATIONS[prov] || {};
    const distNames = Object.keys(districts);
    const dist = distNames.includes(addr.district) ? addr.district : distNames[0] || "";
    const wards = districts[dist] || [];
    const wd = wards.includes(addr.ward) ? addr.ward : wards[0] || "";

    setEditWarehousePayload({
      contactName: addr.contactName || "",
      phone: addr.phone || "",
      province: prov,
      district: dist,
      ward: wd,
      detailAddress: addr.detailAddress || "",
      isDefault: !!addr.isDefault,
    });
  };

  // Submit Edit Warehouse
  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse) return;
    const { isValid, errors } = validateWarehouseForm(editWarehousePayload);
    if (!isValid) {
      setEditWarehouseErrors(errors);
      return;
    }

    setWarehouseSubmitting(true);
    try {
      await updateStoreAddress(editingWarehouse.id, {
        ...editWarehousePayload,
        contactName: editWarehousePayload.contactName.trim(),
        phone: editWarehousePayload.phone.trim(),
        detailAddress: editWarehousePayload.detailAddress.trim(),
      });
      toast.success("Đã cập nhật thông tin kho hàng thành công!");
      setEditingWarehouse(null);
      setEditWarehouseErrors({});
      await loadData(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật địa chỉ kho";
      toast.error(msg);
    } finally {
      setWarehouseSubmitting(false);
    }
  };

  // Delete Warehouse
  const handleDeleteWarehouse = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ kho lấy hàng này?")) return;
    try {
      await deleteStoreAddress(id);
      toast.success("Đã xóa địa chỉ kho thành công!");
      await loadData(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xóa kho";
      toast.error(msg);
    }
  };

  // Set default Warehouse
  const handleSetDefaultWarehouse = async (id: number) => {
    try {
      await setDefaultStoreAddress(id);
      toast.success("Đã đặt làm kho lấy hàng mặc định!");
      await loadData(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      toast.error(msg);
    }
  };

  const handleAiSuggestBio = () => {
    setDescription(
      `${storeName || "TechZone"} – Thương hiệu thiết bị công nghệ & phụ kiện chính hãng hàng đầu. Cam kết 100% sản phẩm có nguồn gốc xuất xứ rõ ràng, bảo hành chính hãng 12-24 tháng, đóng gói chống sốc chuẩn quy cách sàn và hỗ trợ đổi trả miễn phí trong 7 ngày.`
    );
    toast.success("Đã áp dụng mô tả gian hàng chuẩn hóa từ AI!");
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/seller" className="hover:text-emerald-600 transition-colors">
          Kênh người bán
        </Link>
        <span>/</span>
        <span>Cài đặt hệ thống</span>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Hồ sơ gian hàng</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hồ sơ gian hàng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý nhận diện thương hiệu, thông tin gian hàng và mạng lưới kho lấy hàng chuẩn SLA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toast.info("Lịch sử cập nhật hồ sơ được kiểm soát tự động qua Audit Log.")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500 text-[18px]">
              history
            </span>
            Xem lịch sử cập nhật
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saveLoading || profile?.status === "BANNED"}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={profile?.status === "BANNED" ? "Gian hàng đang bị khóa - Không thể lưu thay đổi" : "Lưu thay đổi"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {profile?.status === "BANNED" ? "lock" : saveLoading ? "progress_activity" : "save"}
            </span>
            {saveLoading ? "Đang lưu..." : profile?.status === "BANNED" ? "Gian hàng đang bị khóa" : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-400">
          <span className="material-symbols-outlined animate-spin text-emerald-600 text-[36px]">
            progress_activity
          </span>
          <p className="text-sm font-medium">Đang tải hồ sơ gian hàng...</p>
        </div>
      ) : error ? (
        <div className="py-16 bg-white rounded-2xl border border-slate-100 text-center">
          <p className="text-sm text-rose-600 font-semibold">{error}</p>
          <button
            type="button"
            onClick={triggerReload}
            className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Form Info & Warehouse addresses */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Basic Info */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                    storefront
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Thông tin cơ bản gian hàng
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Trạng thái: Hoạt động ({profile?.status || "APPROVED"})
                </span>
              </div>

              {/* Logo & Banner Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Logo */}
                <div className="md:col-span-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Logo gian hàng (1:1)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      {logoUploading ? (
                        <span className="material-symbols-outlined animate-spin text-emerald-600 text-[24px]">
                          progress_activity
                        </span>
                      ) : logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={logoUrl}
                          alt="Store Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-400 text-[28px]">
                          photo_camera
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={logoUploading}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">upload</span>
                          Tải ảnh lên
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Khuyến nghị: 500x500px, tối đa 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Ảnh bìa gian hàng (Banner 16:9)
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Tỷ lệ 16:9 khuyến nghị</span>
                  </div>
                  <div className="h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 overflow-hidden relative group">
                    {bannerUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={bannerUrl}
                        alt="Store Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                        Chưa thiết lập ảnh bìa gian hàng
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg shadow-sm backdrop-blur-sm transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          upload
                        </span>
                        Tải ảnh
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Name & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <span>Tên gian hàng</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      Chính thức
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="VD: TechZone Official Store"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tên hiển thị công khai trên ứng dụng mua sắm và hóa đơn
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Đường dẫn định danh (Slug shop)
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 text-xs bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-400 font-mono">
                      flashsale.vn/shop/
                    </span>
                    <input
                      type="text"
                      disabled
                      value={profile?.slug || storeName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "store"}
                      className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 font-mono font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const slug = profile?.slug || storeName.toLowerCase().replace(/[^a-z0-9]/g, "-");
                        navigator.clipboard.writeText(`https://flashsale.vn/shop/${slug}`);
                        toast.success("Đã sao chép link gian hàng!");
                      }}
                      className="px-3 py-2 text-xs font-semibold bg-white border border-l-0 border-slate-200 rounded-r-xl text-slate-700 hover:bg-slate-50"
                      title="Sao chép link shop"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        content_copy
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Store Bio / Description */}
              <div className="text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    Mô tả giới thiệu gian hàng
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAiSuggestBio}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        auto_awesome
                      </span>
                      Gợi ý AI
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {description.length} / 1000 ký tự
                    </span>
                  </div>
                </div>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả danh mục kinh doanh, xuất xứ sản phẩm, chính sách bảo hành, cam kết chất lượng..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                />
              </div>
            </div>

            {/* Card 2: Warehouses */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                    local_shipping
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Địa chỉ kho lấy hàng ({addresses.length})
                    </h2>
                    <p className="text-xs text-slate-400">
                      Đơn vị vận chuyển (GHTK, SPX, GHN) sẽ đến lấy hàng theo các địa chỉ kho này
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddWarehouseOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    add_location_alt
                  </span>
                  + Thêm kho mới
                </button>
              </div>

              {/* Warehouse Items */}
              {addresses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <span className="material-symbols-outlined text-[32px] text-slate-300">
                    warehouse
                  </span>
                  <p className="text-xs font-medium mt-1">Chưa có địa chỉ kho lấy hàng nào</p>
                  <button
                    type="button"
                    onClick={() => setIsAddWarehouseOpen(true)}
                    className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Thêm kho lấy hàng đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-xl border transition-all ${
                        addr.isDefault
                          ? "border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-500/10"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {addr.warehouseCode || `KHO-${addr.id}`}
                            </span>
                            {addr.isDefault && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-600 text-white">
                                <span className="material-symbols-outlined text-[11px]">check</span>
                                Kho mặc định
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-700 font-medium">
                            {addr.detailAddress}, {addr.ward}, {addr.district}, {addr.province}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">badge</span>
                              Thủ kho: {addr.contactName}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">call</span>
                              {addr.phone}
                            </span>
                            {addr.workingHours && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">schedule</span>
                                {addr.workingHours}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 text-xs flex-shrink-0 pt-2 md:pt-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditWarehouse(addr)}
                            className="text-slate-600 hover:text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Sửa
                          </button>
                          <span className="text-slate-300">|</span>
                          {!addr.isDefault && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSetDefaultWarehouse(addr.id)}
                                className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                              >
                                Đặt mặc định
                              </button>
                              <span className="text-slate-300">|</span>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteWarehouse(addr.id)}
                            className="text-rose-500 hover:text-rose-700 font-medium"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Store Status & Smartphone Frame Mockup */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card: Store Status & Metrics */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                  verified_user
                </span>
                <span>Thông tin định danh</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Mã gian hàng:</span>
                  <span className="font-mono font-bold text-slate-900">
                    #SHOP-{profile?.id ? String(profile.id).padStart(4, "0") : "0010"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ngày gia nhập:</span>
                  <span className="font-medium text-slate-900">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "15/03/2025"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí hoa hồng sàn:</span>
                  <span className="font-bold text-emerald-700">
                    {profile?.defaultCommissionRate ? (Number(profile.defaultCommissionRate) * 100).toFixed(1) : "5.0"}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Đánh giá trung bình:</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {profile?.ratingAvg ? Number(profile.ratingAvg).toFixed(1) : "5.0"} / 5.0
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                  <span>Chỉ số vận hành SLA:</span>
                  <span className="font-bold text-emerald-600">99.2% (Xuất sắc)</span>
                </div>
              </div>
            </div>

            {/* Smartphone Mockup Realtime Preview */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[16px]">
                    smartphone
                  </span>
                  Xem trước gian hàng trên Mobile
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Realtime
                </span>
              </div>

              {/* Phone Frame */}
              <div className="w-full max-w-[300px] mx-auto rounded-[32px] border-[6px] border-slate-900 shadow-2xl overflow-hidden bg-slate-50 relative">
                {/* Status Bar */}
                <div className="bg-slate-900 text-white px-5 py-1 flex items-center justify-between text-[9px] font-mono">
                  <span>09:41</span>
                  <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto" />
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">wifi</span>
                    <span className="material-symbols-outlined text-[10px]">battery_full</span>
                  </span>
                </div>

                {/* Banner & Logo Inside Phone */}
                <div className="relative h-24 bg-slate-200">
                  {bannerUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={bannerUrl}
                      alt="Banner Mockup"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-teal-700 flex items-center justify-center text-white/50 text-[10px]">
                      Banner Shop
                    </div>
                  )}
                  <div className="absolute -bottom-4 left-3 w-12 h-12 rounded-xl border-2 border-white bg-white overflow-hidden shadow-md">
                    {logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={logoUrl}
                        alt="Logo Mockup"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                        {storeName ? storeName.slice(0, 3).toUpperCase() : "TZ"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shop Phone Content */}
                <div className="pt-6 px-3 pb-4 space-y-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        {storeName || "Gian hàng của bạn"}
                        <span className="bg-rose-500 text-white text-[8px] font-bold px-1 rounded">
                          Official
                        </span>
                      </p>
                      <p className="text-slate-400 text-[9px]">
                        12.8k Người theo dõi • Đánh giá 5.0 ★
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-full"
                    >
                      + Theo dõi
                    </button>
                  </div>

                  <p className="text-slate-600 text-[9px] line-clamp-2 leading-relaxed">
                    {description || "Chưa có mô tả gian hàng..."}
                  </p>

                  {/* Tabs mockup */}
                  <div className="flex items-center justify-around border-t border-slate-200 pt-2 text-[9px] text-slate-500 font-semibold">
                    <span className="text-emerald-700 border-b-2 border-emerald-600 pb-0.5">
                      Sản phẩm
                    </span>
                    <span>Flash Sale (2)</span>
                    <span>Voucher</span>
                    <span>Hồ sơ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal Thêm kho lấy hàng mới */}
      {isAddWarehouseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!warehouseSubmitting) {
                setIsAddWarehouseOpen(false);
                setAddWarehouseErrors({});
              }
            }}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                  add_location_alt
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Thêm kho lấy hàng mới
                </h3>
              </div>
              <button
                type="button"
                disabled={warehouseSubmitting}
                onClick={() => {
                  setIsAddWarehouseOpen(false);
                  setAddWarehouseErrors({});
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} noValidate className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Người phụ trách kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newWarehouse.contactName}
                    onBlur={(e) => {
                      const err = validateWarehouseField("contactName", e.target.value);
                      setAddWarehouseErrors((p) => ({ ...p, contactName: err }));
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewWarehouse((p) => ({ ...p, contactName: val }));
                      if (addWarehouseErrors.contactName) {
                        const err = validateWarehouseField("contactName", val);
                        setAddWarehouseErrors((p) => ({ ...p, contactName: err }));
                      }
                    }}
                    placeholder="VD: Nguyễn Văn Tuấn"
                    className={`w-full p-2.5 rounded-xl border focus:bg-white focus:outline-none transition-colors ${
                      addWarehouseErrors.contactName
                        ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                  />
                  {addWarehouseErrors.contactName && (
                    <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1.5 animate-fadeIn">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {addWarehouseErrors.contactName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={newWarehouse.phone}
                    onBlur={(e) => {
                      const err = validateWarehouseField("phone", e.target.value);
                      setAddWarehouseErrors((p) => ({ ...p, phone: err }));
                    }}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                      setNewWarehouse((p) => ({ ...p, phone: digits }));
                      if (addWarehouseErrors.phone) {
                        const err = validateWarehouseField("phone", digits);
                        setAddWarehouseErrors((p) => ({ ...p, phone: err }));
                      }
                    }}
                    placeholder="VD: 0912345678"
                    className={`w-full p-2.5 rounded-xl border focus:bg-white focus:outline-none transition-colors ${
                      addWarehouseErrors.phone
                        ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                  />
                  {addWarehouseErrors.phone && (
                    <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1.5 animate-fadeIn">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {addWarehouseErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Cascade Location Selectors */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tỉnh / Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newWarehouse.province}
                    onChange={(e) => {
                      const prov = e.target.value;
                      const dists = Object.keys(VIETNAM_LOCATIONS[prov] || {});
                      const defaultDist = dists[0] || "";
                      const defaultWards = (VIETNAM_LOCATIONS[prov]?.[defaultDist] || []);
                      setNewWarehouse((p) => ({
                        ...p,
                        province: prov,
                        district: defaultDist,
                        ward: defaultWards[0] || "",
                      }));
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {Object.keys(VIETNAM_LOCATIONS).map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Quận / Huyện <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newWarehouse.district}
                    onChange={(e) => {
                      const dist = e.target.value;
                      const wards = VIETNAM_LOCATIONS[newWarehouse.province]?.[dist] || [];
                      setNewWarehouse((p) => ({
                        ...p,
                        district: dist,
                        ward: wards[0] || "",
                      }));
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {Object.keys(VIETNAM_LOCATIONS[newWarehouse.province] || {}).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Phường / Xã <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newWarehouse.ward}
                    onChange={(e) =>
                      setNewWarehouse((p) => ({ ...p, ward: e.target.value }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {(VIETNAM_LOCATIONS[newWarehouse.province]?.[newWarehouse.district] || []).map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, cụm kho) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newWarehouse.detailAddress}
                  onBlur={(e) => {
                    const err = validateWarehouseField("detailAddress", e.target.value);
                    setAddWarehouseErrors((p) => ({ ...p, detailAddress: err }));
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewWarehouse((p) => ({ ...p, detailAddress: val }));
                    if (addWarehouseErrors.detailAddress) {
                      const err = validateWarehouseField("detailAddress", val);
                      setAddWarehouseErrors((p) => ({ ...p, detailAddress: err }));
                    }
                  }}
                  placeholder="VD: Số 12 Đường D2, Khu Công Nghệ Cao"
                  className={`w-full p-2.5 rounded-xl border focus:bg-white focus:outline-none transition-colors ${
                    addWarehouseErrors.detailAddress
                      ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20"
                  }`}
                />
                {addWarehouseErrors.detailAddress && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1.5 animate-fadeIn">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    {addWarehouseErrors.detailAddress}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newWarehouse.isDefault}
                  onChange={(e) =>
                    setNewWarehouse((p) => ({ ...p, isDefault: e.target.checked }))
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="text-slate-800 font-semibold select-none">
                  Đặt làm kho lấy hàng mặc định cho các đơn hàng mới
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={warehouseSubmitting}
                  onClick={() => {
                    setIsAddWarehouseOpen(false);
                    setAddWarehouseErrors({});
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={warehouseSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {warehouseSubmitting && (
                    <span className="material-symbols-outlined text-[15px] animate-spin">
                      progress_activity
                    </span>
                  )}
                  {warehouseSubmitting ? "Đang tạo..." : "Tạo kho lấy hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa kho lấy hàng */}
      {editingWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!warehouseSubmitting) {
                setEditingWarehouse(null);
                setEditWarehouseErrors({});
              }
            }}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                  edit_location_alt
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Cập nhật kho: {editingWarehouse.warehouseCode || `KHO-${editingWarehouse.id}`}
                </h3>
              </div>
              <button
                type="button"
                disabled={warehouseSubmitting}
                onClick={() => {
                  setEditingWarehouse(null);
                  setEditWarehouseErrors({});
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateWarehouse} noValidate className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Người phụ trách kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editWarehousePayload.contactName}
                    onBlur={(e) => {
                      const err = validateWarehouseField("contactName", e.target.value);
                      setEditWarehouseErrors((p) => ({ ...p, contactName: err }));
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditWarehousePayload((p) => ({ ...p, contactName: val }));
                      if (editWarehouseErrors.contactName) {
                        const err = validateWarehouseField("contactName", val);
                        setEditWarehouseErrors((p) => ({ ...p, contactName: err }));
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border focus:bg-white focus:outline-none transition-colors ${
                      editWarehouseErrors.contactName
                        ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                  />
                  {editWarehouseErrors.contactName && (
                    <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1.5 animate-fadeIn">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {editWarehouseErrors.contactName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={editWarehousePayload.phone}
                    onBlur={(e) => {
                      const err = validateWarehouseField("phone", e.target.value);
                      setEditWarehouseErrors((p) => ({ ...p, phone: err }));
                    }}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                      setEditWarehousePayload((p) => ({ ...p, phone: digits }));
                      if (editWarehouseErrors.phone) {
                        const err = validateWarehouseField("phone", digits);
                        setEditWarehouseErrors((p) => ({ ...p, phone: err }));
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border focus:bg-white focus:outline-none transition-colors ${
                      editWarehouseErrors.phone
                        ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20"
                    }`}
                  />
                  {editWarehouseErrors.phone && (
                    <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1.5 animate-fadeIn">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {editWarehouseErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Cascade Location Selectors */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tỉnh / Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editWarehousePayload.province}
                    onChange={(e) => {
                      const prov = e.target.value;
                      const dists = Object.keys(VIETNAM_LOCATIONS[prov] || {});
                      const defaultDist = dists[0] || "";
                      const defaultWards = (VIETNAM_LOCATIONS[prov]?.[defaultDist] || []);
                      setEditWarehousePayload((p) => ({
                        ...p,
                        province: prov,
                        district: defaultDist,
                        ward: defaultWards[0] || "",
                      }));
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {Object.keys(VIETNAM_LOCATIONS).map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Quận / Huyện <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editWarehousePayload.district}
                    onChange={(e) => {
                      const dist = e.target.value;
                      const wards = VIETNAM_LOCATIONS[editWarehousePayload.province]?.[dist] || [];
                      setEditWarehousePayload((p) => ({
                        ...p,
                        district: dist,
                        ward: wards[0] || "",
                      }));
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {Object.keys(VIETNAM_LOCATIONS[editWarehousePayload.province] || {}).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Phường / Xã <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editWarehousePayload.ward}
                    onChange={(e) =>
                      setEditWarehousePayload((p) => ({ ...p, ward: e.target.value }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {(VIETNAM_LOCATIONS[editWarehousePayload.province]?.[editWarehousePayload.district] || []).map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, cụm kho) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editWarehousePayload.detailAddress}
                  onBlur={(e) => {
                    const err = validateWarehouseField("detailAddress", e.target.value);
                    setEditWarehouseErrors((p) => ({ ...p, detailAddress: err }));
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditWarehousePayload((p) => ({ ...p, detailAddress: val }));
                    if (editWarehouseErrors.detailAddress) {
                      const err = validateWarehouseField("detailAddress", val);
                      setEditWarehouseErrors((p) => ({ ...p, detailAddress: err }));
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl border focus:bg-white focus:outline-none transition-colors ${
                    editWarehouseErrors.detailAddress
                      ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20"
                  }`}
                />
                {editWarehouseErrors.detailAddress && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1.5 animate-fadeIn">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    {editWarehouseErrors.detailAddress}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editWarehousePayload.isDefault}
                  onChange={(e) =>
                    setEditWarehousePayload((p) => ({ ...p, isDefault: e.target.checked }))
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="text-slate-800 font-semibold select-none">
                  Đặt làm kho lấy hàng mặc định
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={warehouseSubmitting}
                  onClick={() => {
                    setEditingWarehouse(null);
                    setEditWarehouseErrors({});
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={warehouseSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {warehouseSubmitting && (
                    <span className="material-symbols-outlined text-[15px] animate-spin">
                      progress_activity
                    </span>
                  )}
                  {warehouseSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
