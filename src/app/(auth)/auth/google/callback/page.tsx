import { Suspense } from "react";
import { GoogleCallbackClient } from "./page-client";
import { LoadingSkeleton } from "./loading";

/**
 * Trang callback OAuth2 tại /auth/google/callback.
 *
 * Server Component shell wrap Suspense + Client Component xử lý logic.
 * Pattern này cần thiết vì useSearchParams là hook bất đồng bộ trong
 * Next 16 — không thể dùng trong Server Component.
 *
 * @see docs/handoffs/google-oauth-fe-integration.md mục 4 (bước 2)
 */
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <GoogleCallbackClient />
    </Suspense>
  );
}
