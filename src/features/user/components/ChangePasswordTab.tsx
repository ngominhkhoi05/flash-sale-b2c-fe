"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useChangePassword } from "@/features/user/hooks";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function ChangePasswordTab() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changeMutation = useChangePassword({
    onSuccess: () => {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ các trường");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có tối thiểu 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    changeMutation.mutate({
      oldPassword,
      newPassword,
      confirmNewPassword: confirmPassword,
    });
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 max-w-2xl">
      <header className="mb-6 pb-4 border-b border-outline-variant/30">
        <h2 className="text-xl font-bold text-on-surface">Đổi mật khẩu</h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mật khẩu hiện tại */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface">Mật khẩu hiện tại</label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
            />
            <button
              type="button"
              onClick={() => setShowOld((p) => !p)}
              className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface"
            >
              <MaterialSymbol name={showOld ? "visibility_off" : "visibility"} size="[18px]" />
            </button>
          </div>
        </div>

        {/* Mật khẩu mới */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface">Mật khẩu mới</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew((p) => !p)}
              className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface"
            >
              <MaterialSymbol name={showNew ? "visibility_off" : "visibility"} size="[18px]" />
            </button>
          </div>
        </div>

        {/* Xác nhận mật khẩu mới */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface">Xác nhận mật khẩu mới</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface"
            >
              <MaterialSymbol name={showConfirm ? "visibility_off" : "visibility"} size="[18px]" />
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={changeMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <MaterialSymbol name="lock_reset" size="[18px]" />
            {changeMutation.isPending ? "Đang xử lý..." : "Cập nhật mật khẩu"}
          </button>
        </div>
      </form>
    </div>
  );
}
