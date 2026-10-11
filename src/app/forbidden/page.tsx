import type { Metadata } from "next";
import { ForbiddenPage } from "@/components/forbidden/ForbiddenPage";

export const metadata: Metadata = {
  title: "Không có quyền truy cập",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ForbiddenPage />;
}
