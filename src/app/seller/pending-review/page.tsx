import Link from "next/link";
import { Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

/**
 * Trang hiển thị khi seller đang ở trạng thái PENDING (rule §9).
 * Server Component: đọc session từ cookie; nếu không phải SELLER hoặc không
 * còn PENDING thì middleware sẽ xử lý redirect.
 */
export default async function HoSoChoDuyetPage() {
  const session = await getServerSession();

  return (
    <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-4 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-seller-soft text-seller">
          <Hourglass className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-ink">Hồ sơ đang được xét duyệt</h1>
        <p className="mt-2 text-sm text-ink-2">
          Cảm ơn bạn đã đăng ký bán hàng trên Vibe Mart. Đội ngũ vận hành sẽ phản hồi trong
          vòng 24–48 giờ làm việc. Bạn sẽ nhận thông báo khi hồ sơ được duyệt.
        </p>
        {session?.email && (
          <p className="mt-2 text-xs text-ink-3">Tài khoản: {session.email}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button asChild>
            <Link href="/trang-chu">Về trang chủ</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/tai-khoan">Tài khoản của tôi</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
