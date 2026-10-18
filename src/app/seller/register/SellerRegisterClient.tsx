"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMeQuery } from "@/features/user/hooks";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { createStoreAddress } from "@/lib/api/seller";
import { apiFetch } from "@/lib/api";

const CATEGORIES = [
  "Thời trang & Phụ kiện",
  "Điện thoại & Thiết bị điện tử",
  "Mỹ phẩm & Chăm sóc sắc đẹp",
  "Nhà cửa & Đời sống",
  "Mẹ & Bé",
  "Bách hóa online",
  "Thể thao & Dã ngoại",
  "Sách & Văn phòng phẩm",
];

import {
  PROVINCE_NAMES,
  getDistrictsByProvince,
  getWardsByDistrict,
} from "@/lib/constants/vietnam-locations";

export function SellerRegisterClient() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { data: meUser } = useMeQuery();
  const currentUser = meUser || authUser;

  const [viewState, setViewState] = useState<"form" | "pending">("form");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Bước 1: Thông tin shop
  const [storeName, setStoreName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Form Bước 2: Địa chỉ kho lấy hàng (Cascade dropdown)
  const initialProv = "Hồ Chí Minh";
  const initialDist = getDistrictsByProvince(initialProv)[0] || "Quận 1";
  const initialWard = getWardsByDistrict(initialProv, initialDist)[0] || "";

  const [warehouseContact, setWarehouseContact] = useState("");
  const [warehousePhone, setWarehousePhone] = useState("");
  const [province, setProvince] = useState(initialProv);
  const [district, setDistrict] = useState(initialDist);
  const [ward, setWard] = useState(initialWard);
  const [detailAddress, setDetailAddress] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: 10.8231, lng: 106.6297 });

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const districts = getDistrictsByProvince(newProv);
    const firstDistrict = districts[0] || "";
    setDistrict(firstDistrict);
    const wards = getWardsByDistrict(newProv, firstDistrict);
    setWard(wards[0] || "");
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const wards = getWardsByDistrict(province, newDist);
    setWard(wards[0] || "");
  };

  useEffect(() => {
    if (currentUser) {
      if (currentUser.email) setContactEmail(currentUser.email);
      if (currentUser.fullName) setWarehouseContact(currentUser.fullName);
      if ((currentUser as any).phone) {
        setContactPhone((currentUser as any).phone);
        setWarehousePhone((currentUser as any).phone);
      }
    }
  }, [currentUser]);

  const isNameAvailable = storeName.trim().length >= 3;

  const isValidVNPhone = (p: string) => {
    const clean = p.replace(/[\s\-\.]/g, "").replace(/^\+84/, "0");
    return /^(0[3|5|7|8|9])\d{8}$/.test(clean);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Vui lòng chọn ảnh dung lượng dưới 1MB");
        return;
      }
      setLogoPreview(URL.createObjectURL(file));
      toast.success("Đã chọn logo shop");
    }
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || storeName.trim().length < 3) {
      toast.error("Tên shop phải có tối thiểu 3 ký tự");
      return;
    }
    if (!contactPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại liên hệ của shop");
      return;
    }
    if (!isValidVNPhone(contactPhone)) {
      toast.error("Số điện thoại liên hệ không hợp lệ (phải gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)");
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseContact.trim()) {
      toast.error("Vui lòng nhập tên người phụ trách kho");
      return;
    }
    if (!warehousePhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại kho lấy hàng");
      return;
    }
    if (!isValidVNPhone(warehousePhone)) {
      toast.error("Số điện thoại kho không hợp lệ (phải gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)");
      return;
    }
    if (!detailAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ kho chi tiết");
      return;
    }
    setStep(3);
  };

  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    try {
      const cleanPhoneDigits = contactPhone.trim().replace(/[\s\-\.]/g, "").replace(/^\+84/, "0").replace(/^0/, "");
      const formattedContactPhone = `+84${cleanPhoneDigits}`;

      const cleanWarehouseDigits = warehousePhone.trim().replace(/[\s\-\.]/g, "").replace(/^\+84/, "0").replace(/^0/, "");
      const formattedWarehousePhone = `+84${cleanWarehouseDigits}`;

      // 1. Gửi request tạo Store vào Database
      await apiFetch("/api/v1/stores", {
        method: "POST",
        json: {
          storeName: storeName.trim(),
          description: description.trim(),
          logoUrl: logoPreview || undefined,
          contactEmail: contactEmail.trim(),
          contactPhone: formattedContactPhone,
        },
      });

      // 2. Gửi địa chỉ kho lấy hàng
      try {
        await createStoreAddress({
          contactName: warehouseContact.trim(),
          phone: formattedWarehousePhone,
          province,
          district: district.trim(),
          ward: ward.trim(),
          detailAddress: detailAddress.trim(),
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          isDefault: true,
        });
      } catch (addrErr) {
        console.warn("[SellerRegister] Create store address warning:", addrErr);
      }

      toast.success("Hồ sơ đăng ký gian hàng đã được gửi thành công!");
      setViewState("pending");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("đã có gian hàng") || msg.includes("already")) {
        toast.info("Tài khoản của bạn đã có gian hàng trên hệ thống!");
        setViewState("pending");
      } else {
        toast.error(msg || "Không thể gửi hồ sơ đăng ký. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // (B) TRẠNG THÁI: HỒ SƠ CHỜ DUYỆT (PENDING APPROVAL)
  // ─────────────────────────────────────────────────────────────────────────────
  if (viewState === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-12 shadow-sm border border-outline-variant/30 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center mb-6 shadow-inner animate-pulse">
            <MaterialSymbol name="hourglass_empty" size="[40px]" />
          </div>

          <h1 className="text-2xl font-bold text-on-surface">Hồ sơ đang được xét duyệt</h1>
          <p className="mt-2 text-sm text-on-surface-variant max-w-md leading-relaxed">
            Chúng tôi sẽ phản hồi trong 1–2 ngày làm việc qua email{" "}
            <span className="font-semibold text-on-surface">{contactEmail}</span>.
          </p>

          <div className="my-5">
            <span className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Chờ duyệt
            </span>
          </div>

          <div className="w-full bg-surface-container-low rounded-2xl p-5 text-left text-xs space-y-2.5 border border-outline-variant/30 my-2">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Tên shop:</span>
              <span className="font-bold text-on-surface">{storeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Ngành hàng:</span>
              <span className="font-medium text-on-surface">{category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Số điện thoại liên hệ:</span>
              <span className="font-mono text-on-surface">{contactPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Kho lấy hàng:</span>
              <span className="text-on-surface truncate max-w-[200px] sm:max-w-xs">
                {detailAddress}, {ward}, {district}, {province}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/seller"
              className="px-6 py-2.5 rounded-xl bg-[#10B981] text-white text-sm font-bold shadow-md hover:bg-emerald-600 transition-colors inline-flex items-center gap-2"
            >
              <MaterialSymbol name="storefront" size="[18px]" />
              Vào Kênh Người Bán
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Về trang mua sắm
            </Link>
            <button
              type="button"
              onClick={() => setViewState("form")}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface"
            >
              Chỉnh sửa thông tin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // (A) FORM ĐĂNG KÝ BÁN HÀNG
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Banner đầu nền #D1FAE5: "Bán hàng cùng Vibe Mart", 3 lợi ích có icon */}
      <section className="bg-[#D1FAE5] border border-[#A7F3D0] rounded-3xl p-6 sm:p-8 mb-8 text-[#065F46] shadow-xs">
        <div className="max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/70 text-[#059669] inline-block mb-2">
            Kênh Người Bán
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] tracking-tight">
            Bán hàng cùng Vibe Mart
          </h1>
          <p className="text-xs sm:text-sm text-[#047857] mt-1.5 leading-relaxed">
            Mở rộng kinh doanh, bùng nổ doanh số với hàng ngàn khách hàng trong các phiên Flash Sale siêu tốc.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#A7F3D0]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#10B981] flex items-center justify-center shadow-xs shrink-0">
              <MaterialSymbol name="group" size="[22px]" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#064E3B]">Tiếp cận hàng triệu khách</h4>
              <p className="text-[11px] text-[#047857]">Lượng truy cập khủng mỗi phiên</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#10B981] flex items-center justify-center shadow-xs shrink-0">
              <MaterialSymbol name="bolt" size="[22px]" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#064E3B]">Tham gia Flash Sale</h4>
              <p className="text-[11px] text-[#047857]">Cơ hội x10 đơn hàng mỗi ngày</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#10B981] flex items-center justify-center shadow-xs shrink-0">
              <MaterialSymbol name="percent" size="[22px]" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#064E3B]">Phí sàn chỉ 5%</h4>
              <p className="text-[11px] text-[#047857]">Mức chiết khấu ưu đãi nhất thị trường</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stepper 3 bước: Thông tin shop → Địa chỉ kho → Xác nhận */}
      <div className="mb-8 max-w-xl mx-auto">
        <div className="flex items-center justify-between relative">
          {[
            { s: 1, label: "Thông tin shop" },
            { s: 2, label: "Địa chỉ kho" },
            { s: 3, label: "Xác nhận" },
          ].map((item) => {
            const isCompleted = step > item.s;
            const isCurrent = step === item.s;

            return (
              <div key={item.s} className="flex flex-col items-center z-10">
                <button
                  type="button"
                  onClick={() => {
                    if (step > item.s) setStep(item.s as any);
                  }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                    isCurrent
                      ? "bg-[#10B981] text-white shadow-md shadow-emerald-500/20 scale-105"
                      : isCompleted
                      ? "bg-[#059669] text-white"
                      : "bg-surface-container text-on-surface-variant"
                  )}
                >
                  {isCompleted ? <MaterialSymbol name="check" size="[20px]" /> : item.s}
                </button>
                <span
                  className={cn(
                    "text-xs font-bold mt-2 text-center",
                    isCurrent ? "text-[#059669]" : "text-on-surface-variant/80"
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          })}

          <div className="absolute top-5 left-10 right-10 h-0.5 bg-surface-container -z-0">
            <div
              className="h-full bg-[#10B981] transition-all"
              style={{
                width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Nội dung Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột chính: Form từng bước */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30">
          {/* BƯỚC 1: THÔNG TIN SHOP */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-6">
              <header className="pb-4 border-b border-outline-variant/30">
                <h2 className="text-lg font-bold text-on-surface">Bước 1: Thông tin gian hàng</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Thiết lập tên và hình ảnh nhận diện thương hiệu của bạn
                </p>
              </header>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface">
                    Tên shop <span className="text-error">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    {storeName.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nhập tên shop của bạn"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                />
                {storeName.trim().length > 0 && (
                  <div className="pt-1">
                    {isNameAvailable ? (
                      <span className="text-xs font-semibold text-[#059669] flex items-center gap-1">
                        <MaterialSymbol name="check_circle" size="[14px]" />
                        ✓ Tên có thể sử dụng
                      </span>
                    ) : (
                      <span className="text-xs text-error">Tên shop tối thiểu 3 ký tự</span>
                    )}
                  </div>
                )}
              </div>

              {/* Logo shop */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface">Logo shop</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#10B981] overflow-hidden flex items-center justify-center bg-[#D1FAE5]/40 hover:bg-[#D1FAE5]/70 transition-colors">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Shop logo" className="w-full h-full object-cover" />
                      ) : (
                        <MaterialSymbol name="add_photo_alternate" size="[24px]" className="text-[#059669]" />
                      )}
                    </div>
                  </label>
                  <div className="text-xs text-on-surface-variant">
                    <p className="font-semibold text-on-surface">Tải lên logo gian hàng</p>
                    <p className="text-[11px] text-on-surface-variant/80 mt-0.5">
                      Định dạng JPG, PNG (tối đa 1MB, khuyến nghị ảnh vuông)
                    </p>
                  </div>
                </div>
              </div>

              {/* Ngành hàng chính */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  Ngành hàng chính <span className="text-error">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mô tả shop */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Mô tả shop</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu đôi nét về shop, thế mạnh và chính sách của bạn..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] resize-none"
                />
              </div>

              {/* Email và SĐT liên hệ từ Database user */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Email liên hệ</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-sm border border-outline-variant font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">SĐT liên hệ</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-sm border border-outline-variant font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#10B981] text-white text-sm font-bold shadow-md hover:bg-emerald-600 transition-colors inline-flex items-center gap-2"
                >
                  Tiếp tục
                  <MaterialSymbol name="arrow_forward" size="[18px]" />
                </button>
              </div>
            </form>
          )}

          {/* BƯỚC 2: ĐỊA CHỈ KHO LẤY HÀNG */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-6">
              <header className="pb-4 border-b border-outline-variant/30">
                <h2 className="text-lg font-bold text-on-surface">Bước 2: Địa chỉ kho lấy hàng</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Đơn vị vận chuyển sẽ đến địa chỉ này để tiếp nhận hàng hóa của shop
                </p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">
                    Tên thủ kho / người gửi hàng <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={warehouseContact}
                    onChange={(e) => setWarehouseContact(e.target.value)}
                    placeholder="Họ tên người phụ trách kho"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">
                    Số điện thoại kho <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={warehousePhone}
                    onChange={(e) => setWarehousePhone(e.target.value)}
                    placeholder="Số điện thoại kho"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                  />
                </div>
              </div>

              {/* Tỉnh / Quận / Phường (Cascade Selects) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">
                    Tỉnh / Thành phố <span className="text-error">*</span>
                  </label>
                  <select
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-outline-variant focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 font-medium"
                  >
                    {PROVINCE_NAMES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">
                    Quận / Huyện <span className="text-error">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-outline-variant focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 font-medium"
                  >
                    {getDistrictsByProvince(province).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">
                    Phường / Xã <span className="text-error">*</span>
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-outline-variant focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 font-medium"
                  >
                    {getWardsByDistrict(province, district).map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Địa chỉ chi tiết */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  Địa chỉ kho chi tiết <span className="text-error">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="Số nhà, ngõ, tên đường kho lấy hàng..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] resize-none"
                />
              </div>

              {/* Bản đồ ghim GPS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <MaterialSymbol name="pin_drop" size="[16px]" className="text-[#10B981]" />
                    Định vị tọa độ kho (GPS)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((p) => {
                          setCoordinates({
                            lat: Number(p.coords.latitude.toFixed(4)),
                            lng: Number(p.coords.longitude.toFixed(4)),
                          });
                          toast.success("Đã lấy tọa độ GPS kho hàng");
                        });
                      }
                    }}
                    className="text-xs font-semibold text-[#059669] hover:underline"
                  >
                    Dùng vị trí hiện tại
                  </button>
                </div>
                <div className="relative h-28 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-25 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex flex-col items-center">
                    <MaterialSymbol name="location_on" size="[32px]" className="text-[#10B981] animate-bounce" />
                    <span className="text-[11px] font-mono bg-white/95 px-2 py-0.5 rounded shadow-xs text-on-surface font-semibold mt-1">
                      {coordinates.lat}, {coordinates.lng}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors inline-flex items-center gap-1.5"
                >
                  <MaterialSymbol name="arrow_back" size="[18px]" />
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#10B981] text-white text-sm font-bold shadow-md hover:bg-emerald-600 transition-colors inline-flex items-center gap-2"
                >
                  Tiếp tục
                  <MaterialSymbol name="arrow_forward" size="[18px]" />
                </button>
              </div>
            </form>
          )}

          {/* BƯỚC 3: XÁC NHẬN */}
          {step === 3 && (
            <div className="space-y-6">
              <header className="pb-4 border-b border-outline-variant/30">
                <h2 className="text-lg font-bold text-on-surface">Bước 3: Xác nhận thông tin hồ sơ</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Vui lòng kiểm tra lại thông tin trước khi gửi hồ sơ vào cơ sở dữ liệu
                </p>
              </header>

              <div className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/30 text-sm">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#059669] mb-2">
                    1. Thông tin gian hàng
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-on-surface-variant">Tên shop:</span>{" "}
                      <span className="font-bold text-on-surface">{storeName}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Ngành hàng:</span>{" "}
                      <span className="font-bold text-on-surface">{category}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Email:</span>{" "}
                      <span className="font-mono text-on-surface">{contactEmail}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Điện thoại:</span>{" "}
                      <span className="font-mono text-on-surface">{contactPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant/20">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#059669] mb-2">
                    2. Thông tin kho lấy hàng
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-on-surface-variant">Thủ kho:</span>{" "}
                      <span className="font-bold text-on-surface">{warehouseContact}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">SĐT kho:</span>{" "}
                      <span className="font-mono text-on-surface">{warehousePhone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-on-surface-variant">Địa chỉ:</span>{" "}
                      <span className="text-on-surface">{detailAddress}, {ward}, {district}, {province}</span>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 w-4 h-4 rounded text-[#10B981] focus:ring-[#10B981] border-outline"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  Tôi đồng ý với{" "}
                  <a href="#" className="font-bold text-[#059669] underline">
                    Điều khoản dịch vụ Người bán
                  </a>{" "}
                  và cam kết cung cấp hàng hóa chính hãng, đảm bảo quyền lợi khách hàng.
                </span>
              </label>

              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors inline-flex items-center gap-1.5"
                >
                  <MaterialSymbol name="arrow_back" size="[18px]" />
                  Quay lại
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitAll}
                  className="px-7 py-2.5 rounded-xl bg-[#10B981] text-white text-sm font-bold shadow-md hover:bg-emerald-600 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <MaterialSymbol name="send" size="[18px]" />
                  {isSubmitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ đăng ký"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cột phụ: Xem trước */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 shadow-xs border border-outline-variant/30 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Xem trước hồ sơ
          </h3>
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#D1FAE5] text-[#059669] flex items-center justify-center font-bold text-lg shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                storeName ? storeName.charAt(0).toUpperCase() : "?"
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-on-surface truncate">
                {storeName || "Tên shop của bạn"}
              </h4>
              <p className="text-[11px] text-on-surface-variant truncate">{category}</p>
            </div>
          </div>

          <div className="text-xs space-y-2 text-on-surface-variant pt-2 border-t border-outline-variant/30">
            <div className="flex items-center gap-2">
              <MaterialSymbol name="storefront" size="[16px]" className="text-[#10B981]" />
              <span>Phí sàn ưu đãi: 5%</span>
            </div>
            <div className="flex items-center gap-2">
              <MaterialSymbol name="timer" size="[16px]" className="text-[#10B981]" />
              <span>Thời gian xét duyệt: 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <MaterialSymbol name="support_agent" size="[16px]" className="text-[#10B981]" />
              <span>Hỗ trợ kỹ thuật 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
