"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMeQuery, useUpdateProfile } from "@/features/user/hooks";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function ProfileTab() {
  const { user: authUser } = useAuth();
  const { data: meUser, isLoading } = useMeQuery();
  const updateMutation = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = meUser || authUser;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      const userRecord = currentUser as unknown as Record<string, unknown>;
      const userPhone = typeof userRecord.phone === "string" ? userRecord.phone : "";
      const timer = setTimeout(() => {
        if (currentUser.fullName) setFullName(currentUser.fullName);
        if (userPhone) setPhone(userPhone);
        if (currentUser.avatarUrl) setAvatarPreview(currentUser.avatarUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Ảnh quá lớn. Vui lòng chọn ảnh dung lượng dưới 1MB.");
        return;
      }
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      toast.success("Đã chọn ảnh đại diện");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }

    const cleanPhone = phone.trim() ? phone.trim().replace(/^(\+84)/, "0") : undefined;

    updateMutation.mutate(
      {
        fullName: fullName.trim(),
        phone: cleanPhone,
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật hồ sơ thành công vào cơ sở dữ liệu!");
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại";
          toast.error(msg);
        },
      }
    );
  };

  if (isLoading && !currentUser) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 space-y-4">
        <div className="h-7 w-44 animate-pulse rounded bg-surface-container" />
        <div className="h-4 w-64 animate-pulse rounded bg-surface-container" />
        <div className="h-60 animate-pulse rounded-xl bg-surface-container mt-4" />
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-outline-variant/30">
      <header className="mb-6 pb-4 border-b border-outline-variant/30">
        <h2 className="text-xl font-bold text-on-surface">Hồ sơ của tôi</h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Quản lý thông tin hồ sơ tài khoản từ cơ sở dữ liệu
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Cột trái: Form thông tin cá nhân */}
        <div className="md:col-span-7 lg:col-span-8 space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface">Email</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                disabled
                value={currentUser?.email || ""}
                placeholder="chua_cap_nhat@email.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-mono text-sm border border-outline-variant/40 cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => toast.info("Tính năng đổi email đang được bảo mật")}
                className="text-xs font-semibold text-primary hover:underline px-2 py-1"
              >
                Đổi
              </button>
            </div>
          </div>

          {/* Họ và tên */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface">
              Họ và tên <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface">Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Giới tính */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface">Giới tính</label>
            <div className="flex items-center gap-6 pt-1">
              {[
                { label: "Nam", val: "male" },
                { label: "Nữ", val: "female" },
                { label: "Khác", val: "other" },
              ].map((g) => (
                <label key={g.val} className="flex items-center gap-2 cursor-pointer text-sm text-on-surface">
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === g.val}
                    onChange={() => setGender(g.val as "male" | "female" | "other")}
                    className="w-4 h-4 text-primary focus:ring-primary border-outline"
                  />
                  <span>{g.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ngày sinh */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface">Ngày sinh</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full sm:w-60 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Nút lưu */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <MaterialSymbol name="save" size="[18px]" />
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        {/* Cột phải: Avatar tròn 120px + nút chọn ảnh */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center justify-center p-6 border-t md:border-t-0 md:border-l border-outline-variant/30 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/png, image/jpeg"
            className="hidden"
          />

          <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
            <div className="w-30 h-30 rounded-full overflow-hidden border-2 border-outline-variant/60 shadow-inner bg-surface-container flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-primary">
                  {fullName ? fullName.charAt(0).toUpperCase() : "?"}
                </span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <MaterialSymbol name="photo_camera" size="[24px]" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors inline-flex items-center gap-1.5"
          >
            <MaterialSymbol name="upload" size="[16px]" />
            Chọn ảnh
          </button>
          <p className="text-[11px] text-on-surface-variant/70 mt-3 leading-relaxed">
            Dung lượng file tối đa 1 MB
            <br />
            Định dạng: .JPEG, .PNG
          </p>
        </div>
      </form>
    </div>
  );
}
