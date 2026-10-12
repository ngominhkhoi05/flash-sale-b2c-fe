import type { Metadata } from "next";
import { MaintenancePage } from "@/components/maintenance/MaintenancePage";

export const metadata: Metadata = {
  title: "Tính năng đang được nâng cấp",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MaintenancePage />;
}
