"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getMyStoreProfile,
  updateMyStoreProfile,
  getStoreAddresses,
  createStoreAddress,
  deleteStoreAddress,
  setDefaultStoreAddress,
} from "@/lib/api/seller";
import type {
  SellerStoreProfileResponse,
  SellerWarehouseAddressItem,
  CreateStoreAddressPayload,
} from "@/types/seller";

export default function SellerProfilePage() {
  const [profile, setProfile] = useState<SellerStoreProfileResponse | null>(null);
  const [addresses, setAddresses] = useState<SellerWarehouseAddressItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for Store Profile
  const [storeName, setStoreName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Add Warehouse Modal
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState<boolean>(false);
  const [newWarehouse, setNewWarehouse] = useState<CreateStoreAddressPayload>({
    contactName: "",
    phone: "",
    province: "TP. Hồ Chí Minh",
    district: "",
    ward: "",
    detailAddress: "",
    isDefault: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const triggerReload = () => {
    setLoading(true);
    setReloadTrigger((p) => p + 1);
  };

  useEffect(() => {
    let active = true;

    Promise.all([getMyStoreProfile(), getStoreAddresses()])
      .then(([prof, addrList]) => {
        if (active) {
          setProfile(prof);
          setStoreName(prof.storeName || "");
          setDescription(prof.description || "");
          setLogoUrl(prof.logoUrl || "");
          setBannerUrl(prof.bannerUrl || "");
          setAddresses(addrList || []);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : "Không thể tải thông tin hồ sơ gian hàng";
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadTrigger]);

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await updateMyStoreProfile({
        storeName,
        description,
        logoUrl,
        bannerUrl,
      });
      showToast("Cập nhật thông tin gian hàng thành công!");
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể lưu thông tin";
      alert(msg);
    } finally {
      setSaveLoading(false);
    }
  };

  // Add Warehouse
  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.contactName || !newWarehouse.phone || !newWarehouse.detailAddress) {
      alert("Vui lòng điền đầy đủ thông tin kho hàng");
      return;
    }

    try {
      await createStoreAddress(newWarehouse);
      showToast("Đã thêm kho lấy hàng mới thành công!");
      setIsAddWarehouseOpen(false);
      setNewWarehouse({
        contactName: "",
        phone: "",
        province: "TP. Hồ Chí Minh",
        district: "",
        ward: "",
        detailAddress: "",
        isDefault: false,
      });
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể thêm địa chỉ kho";
      alert(msg);
    }
  };

  // Delete Warehouse
  const handleDeleteWarehouse = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ kho này?")) return;
    try {
      await deleteStoreAddress(id);
      showToast("Đã xóa địa chỉ kho!");
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xóa kho";
      alert(msg);
    }
  };

  // Set default Warehouse
  const handleSetDefaultWarehouse = async (id: number) => {
    try {
      await setDefaultStoreAddress(id);
      showToast("Đã đặt làm kho lấy hàng mặc định!");
      triggerReload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      alert(msg);
    }
  };

  const handleAiSuggestBio = () => {
    setDescription(
      "UTC Fashion – Thương hiệu thời trang đường phố đương đại dành cho giới trẻ. Cam kết chất lượng vải nỉ bông hữu cơ 100%, bảo hành đường chỉ trọn đời và hỗ trợ đổi trả miễn phí trong 7 ngày."
    );
    showToast("Đã áp dụng gợi ý mô tả chuyên nghiệp từ AI!");
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-xl transition-all animate-bounce">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

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
            Quản lý nhận diện thương hiệu, mô tả gian hàng và mạng lưới kho lấy hàng chuẩn SLA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast("Lịch sử cập nhật hồ sơ được lưu tự động trong audit log.")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500 text-[18px]">
              history
            </span>
            Xem lịch sử cập nhật
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={saveLoading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saveLoading ? "Đang lưu..." : "Lưu thay đổi"}
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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Trạng thái: Hoạt động (Approved)
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
                      {logoUrl ? (
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
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt("Nhập link ảnh Logo mới:", logoUrl);
                          if (url) setLogoUrl(url);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">upload</span>
                        Đổi logo
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Khuyến nghị: 500x500px, PNG/JPG
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
                    <span className="text-[10px] text-slate-400">Tỷ lệ vàng 16:9</span>
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
                        Chưa có banner
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Nhập link ảnh Banner 16:9 mới:", bannerUrl);
                        if (url) setBannerUrl(url);
                      }}
                      className="absolute bottom-2 right-2 px-2.5 py-1 text-xs font-semibold bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg shadow-sm backdrop-blur-sm transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        add_photo_alternate
                      </span>
                      Đổi ảnh bìa
                    </button>
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
                      <span className="material-symbols-outlined text-slate-400 text-[14px]">
                        lock
                      </span>
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      Đã xác thực
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={storeName}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">info</span>
                    Liên hệ Quản trị viên sàn để yêu cầu đổi tên gian hàng
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tên định danh (Slug shop) *
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 text-xs bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-400 font-mono">
                      vibemart.vn/shop/
                    </span>
                    <input
                      type="text"
                      disabled
                      value={profile?.slug || "utc-fashion"}
                      className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 font-mono font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://vibemart.vn/shop/${profile?.slug || "utc-fashion"}`);
                        showToast("Đã sao chép đường link gian hàng!");
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
                  placeholder="Mô tả phong cách, xuất xứ sản phẩm, chính sách bảo hành của gian hàng..."
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
                      Địa chỉ kho lấy hàng
                    </h2>
                    <p className="text-xs text-slate-400">
                      Đơn vị vận chuyển sẽ đến các địa chỉ này để lấy kiện hàng chuẩn bị giao
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
                  + Thêm kho lấy hàng mới
                </button>
              </div>

              {/* Warehouse Items */}
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
                          {addr.latitude && addr.longitude && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                              <span className="material-symbols-outlined text-[13px]">location_on</span>
                              GPS: {addr.latitude}, {addr.longitude}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 text-xs flex-shrink-0 pt-2 md:pt-0">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultWarehouse(addr.id)}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                          >
                            Đặt làm mặc định
                          </button>
                        )}
                        {!addr.isDefault && <span className="text-slate-300">|</span>}
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
                <span>Trạng thái gian hàng</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Mã gian hàng:</span>
                  <span className="font-mono font-bold text-slate-900">
                    #VM-{profile?.id ? String(profile.id).padStart(4, "0") : "8842"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ngày tham gia sàn:</span>
                  <span className="font-medium text-slate-900">
                    {profile?.createdAt || "15/03/2025"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tỷ lệ hoa hồng sàn:</span>
                  <span className="font-bold text-emerald-700">
                    {profile?.defaultCommissionRate || 5.0}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Đánh giá trung bình:</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {profile?.ratingAvg || 4.8} / 5.0
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                  <span>Chỉ số vận hành SLA:</span>
                  <span className="font-bold text-emerald-600">98.6% (Rất tốt)</span>
                </div>
              </div>
            </div>

            {/* Smartphone Mockup */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[16px]">
                    smartphone
                  </span>
                  Xem trước giao diện Shop
                </span>
                <span className="text-[10px] text-slate-400">Mobile 390px</span>
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
                    <div className="w-full h-full bg-emerald-700" />
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
                        UTC
                      </div>
                    )}
                  </div>
                </div>

                {/* Shop Phone Content */}
                <div className="pt-6 px-3 pb-4 space-y-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        {storeName || "UTC Fashion"}
                        <span className="bg-rose-500 text-white text-[8px] font-bold px-1 rounded">
                          Mall
                        </span>
                      </p>
                      <p className="text-slate-400 text-[9px]">
                        12.4k Người theo dõi • 128 SP
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
                      Cửa hàng
                    </span>
                    <span>Tất cả SP</span>
                    <span>Voucher (4)</span>
                    <span>Hồ sơ</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://vibemart.vn/shop/${profile?.slug || "utc-fashion"}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block w-full text-center py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                Xem trang shop thực tế trên Vibe Mart ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {isAddWarehouseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsAddWarehouseOpen(false)}
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
                onClick={() => setIsAddWarehouseOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tên người phụ trách kho *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWarehouse.contactName}
                    onChange={(e) =>
                      setNewWarehouse((p) => ({ ...p, contactName: e.target.value }))
                    }
                    placeholder="VD: Nguyễn Văn Tuấn"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWarehouse.phone}
                    onChange={(e) =>
                      setNewWarehouse((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="VD: 0912 345 678"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tỉnh / Thành phố *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWarehouse.province}
                    onChange={(e) =>
                      setNewWarehouse((p) => ({ ...p, province: e.target.value }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Quận / Huyện *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWarehouse.district}
                    onChange={(e) =>
                      setNewWarehouse((p) => ({ ...p, district: e.target.value }))
                    }
                    placeholder="VD: TP. Thủ Đức"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Phường / Xã *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWarehouse.ward}
                    onChange={(e) =>
                      setNewWarehouse((p) => ({ ...p, ward: e.target.value }))
                    }
                    placeholder="VD: Thạnh Mỹ Lợi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, tên kho) *
                </label>
                <input
                  type="text"
                  required
                  value={newWarehouse.detailAddress}
                  onChange={(e) =>
                    setNewWarehouse((p) => ({ ...p, detailAddress: e.target.value }))
                  }
                  placeholder="VD: Cụm Công nghiệp Cát Lái 2, đường K1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                <span className="text-slate-800 font-semibold">
                  Đặt làm kho lấy hàng mặc định
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddWarehouseOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                >
                  Thêm kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
