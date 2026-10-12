import type { Metadata } from "next";
import { MaintenancePage } from "@/components/maintenance/MaintenancePage";
import { isMaintenanceFeatureCode } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tính năng đang được nâng cấp",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ feature?: string | string[] }>;

export default async function Page({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  // Resolve `?feature=<code>` từ URL (Next 16: searchParams là Promise).
  // - Chỉ chấp nhận code nằm trong MAINTENANCE_FEATURE_CODES enum.
  // - Nếu invalid / missing → undefined → MaintenancePage dùng fallback mặc định.
  const params = searchParams ? await searchParams : undefined;
  const raw = params?.feature;
  const code = Array.isArray(raw) ? raw[0] : raw;
  const featureCode = isMaintenanceFeatureCode(code) ? code : undefined;

  return <MaintenancePage featureCode={featureCode} />;
}
