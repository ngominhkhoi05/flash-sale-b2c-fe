"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { VoucherWalletClient } from "@/features/vouchers/components/VoucherWalletClient";

export default function AccountVouchersPage() {
  return (
    <AuthGuard
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 h-72 animate-pulse rounded-2xl bg-surface-container" />
            <div className="lg:col-span-9 h-96 animate-pulse rounded-2xl bg-surface-container" />
          </div>
        </div>
      }
    >
      <VoucherWalletClient />
    </AuthGuard>
  );
}
