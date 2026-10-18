"use client";

import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { MaterialSymbol } from "@/components/ui/material-symbol";

interface SocialAccount {
  id: string;
  provider: "google" | "facebook" | "github";
  name: string;
  iconBg: string;
  linkedEmail?: string | null;
  isLinked: boolean;
}

export function LinkedAccountsTab() {
  const { user } = useAuth();

  const accounts: SocialAccount[] = [
    {
      id: "google",
      provider: "google",
      name: "Google",
      iconBg: "bg-red-50 text-red-600 border-red-200",
      linkedEmail: user?.email || "an.nguyen@gmail.com",
      isLinked: true,
    },
    {
      id: "facebook",
      provider: "facebook",
      name: "Facebook",
      iconBg: "bg-blue-50 text-blue-600 border-blue-200",
      linkedEmail: null,
      isLinked: false,
    },
    {
      id: "github",
      provider: "github",
      name: "GitHub",
      iconBg: "bg-neutral-100 text-neutral-800 border-neutral-300",
      linkedEmail: null,
      isLinked: false,
    },
  ];

  const handleLink = (provider: string) => {
    if (provider === "google") {
      toast.info("Tài khoản Google đã được liên kết với email của bạn");
      return;
    }
    toast.success(`Đang mở cổng liên kết tài khoản ${provider.toUpperCase()}...`);
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-outline-variant/30">
      <header className="mb-6 pb-4 border-b border-outline-variant/30">
        <h2 className="text-xl font-bold text-on-surface">Liên kết tài khoản</h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Liên kết tài khoản mạng xã hội để đăng nhập nhanh chóng và an toàn hơn
        </p>
      </header>

      <div className="divide-y divide-outline-variant/20">
        {accounts.map((acc) => (
          <div key={acc.id} className="py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Icon đại diện */}
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg border ${acc.iconBg}`}
              >
                {acc.provider === "google" && "G"}
                {acc.provider === "facebook" && "f"}
                {acc.provider === "github" && (
                  <MaterialSymbol name="terminal" size="[22px]" />
                )}
              </div>

              <div>
                <h4 className="font-bold text-sm text-on-surface">{acc.name}</h4>
                {acc.isLinked && acc.linkedEmail ? (
                  <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                    {acc.linkedEmail}
                  </p>
                ) : (
                  <p className="text-xs text-on-surface-variant/70 mt-0.5">
                    Chưa liên kết
                  </p>
                )}
              </div>
            </div>

            <div>
              {acc.isLinked ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                    <MaterialSymbol name="check_circle" size="[14px]" />
                    Đã liên kết
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.info("Không thể hủy liên kết phương thức đăng nhập chính")}
                    className="text-xs text-on-surface-variant hover:text-error hover:underline px-2 py-1"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLink(acc.provider)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Liên kết
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
