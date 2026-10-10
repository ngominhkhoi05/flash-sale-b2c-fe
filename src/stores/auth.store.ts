"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORAGE_KEYS, type Role } from "@/lib/constants";

/**
 * Auth store (Zustand persisted – rule state-management).
 * Persist key "fs_auth" (rule auth-jwt).
 * KHÔNG lưu accessToken ở đây (đã có localStorage "fs_access_token");
 * chỉ lưu thông tin user/role để UI tiện render.
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  /** URL ảnh đại diện user từ backend (UserResponse.avatarUrl).
   *  Optional – nếu user chưa upload avatar hoặc backend trả null. */
  avatarUrl?: string;
  role: Role;
  permissions?: string[]; // code quyền (vd: "product:update")
  storeStatus?: "PENDING" | "APPROVED" | "BANNED";
}

interface AuthState {
  user: AuthUser | null;
  isHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  updateRole: (role: Role) => void;
  reset: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,
      setUser: (user) => set({ user }),
      updateRole: (role) =>
        set((state) => (state.user ? { user: { ...state.user, role } } : state)),
      reset: () => set({ user: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: STORAGE_KEYS.AUTH,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
