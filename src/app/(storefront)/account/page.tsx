"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AccountSidebar, type AccountSidebarItem } from "@/components/account/AccountSidebar";
import { ProfileTab } from "@/features/user/components/ProfileTab";
import { AddressBookTab } from "@/features/user/components/AddressBookTab";
import { LinkedAccountsTab } from "@/features/user/components/LinkedAccountsTab";
import { ChangePasswordTab } from "@/features/user/components/ChangePasswordTab";
import { useAuth } from "@/hooks/useAuth";

function AccountPageInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const tabParam = searchParams.get("tab") as AccountSidebarItem | null;
  const currentTab: AccountSidebarItem =
    tabParam && ["profile", "addresses", "linked", "password"].includes(tabParam)
      ? tabParam
      : "profile";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Menu trái 240px */}
        <div className="lg:col-span-3">
          <AccountSidebar
            activeItem={currentTab}
            displayName={user?.fullName}
            email={user?.email}
            avatarUrl={user?.avatarUrl}
          />
        </div>

        {/* Nội dung tương ứng với tab đang chọn */}
        <main className="lg:col-span-9">
          {currentTab === "profile" && <ProfileTab />}
          {currentTab === "addresses" && <AddressBookTab />}
          {currentTab === "linked" && <LinkedAccountsTab />}
          {currentTab === "password" && <ChangePasswordTab />}
        </main>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 h-72 animate-pulse rounded-2xl bg-surface-container" />
            <div className="lg:col-span-9 h-96 animate-pulse rounded-2xl bg-surface-container" />
          </div>
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="h-96 animate-pulse rounded-2xl bg-surface-container" />
          </div>
        }
      >
        <AccountPageInner />
      </Suspense>
    </AuthGuard>
  );
}
