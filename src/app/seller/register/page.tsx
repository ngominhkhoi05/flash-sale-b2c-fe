"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { SellerRegisterClient } from "./SellerRegisterClient";

export default function SellerRegisterPage() {
  return (
    <AuthGuard
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="h-44 animate-pulse rounded-3xl bg-surface-container mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 h-96 animate-pulse rounded-3xl bg-surface-container" />
            <div className="lg:col-span-4 h-64 animate-pulse rounded-3xl bg-surface-container" />
          </div>
        </div>
      }
    >
      <SellerRegisterClient />
    </AuthGuard>
  );
}
