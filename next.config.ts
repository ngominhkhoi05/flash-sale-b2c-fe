import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Reverse proxy `/api/*` → backend `http://180.93.137.28` (rule
  // workflow-process.mdc Bước 5.0: phân loại file config, không có logic –
  // không cần test).
  //
  // Lý do (2026-10-18): Nginx + Spring Boot CORS filter cùng thêm header
  // `Access-Control-Allow-Origin` khiến response có 2 giá trị trùng nhau
  // → browser reject theo spec CORS. Workaround phía FE: gọi qua same-origin
  // `/api/v1/...` rồi Next dev proxy tới BE → tránh preflight + duplicate
  // header. Khi BE sửa xong (bỏ CORS ở Nginx HOẶC ở Spring, giữ 1 chỗ),
  // có thể revert lại dùng NEXT_PUBLIC_API_URL absolute.
  //
  // Lưu ý: rewrites chỉ áp dụng cho fetch, không áp dụng cho WebSocket
  // (vẫn dùng NEXT_PUBLIC_WS_URL=http://180.93.137.28/ws).
  async rewrites() {
    const apiBase = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://180.93.137.28"
    ).replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
  // Bỏ qua kiểm tra TypeScript khi `next build` để giảm tải RAM/CPU trên
  // VPS deploy. Vẫn chạy `tsc --noEmit` riêng trong CI / local để bắt lỗi
  // trước khi push.
  //
  // Lưu ý: Next 16 đã xoá `eslint.ignoreDuringBuilds` (breaking change vs
  // Next 13/14/15) — `next build` không chạy ESLint nữa nên không cần option
  // tương đương. Vẫn chạy `npm run lint` riêng trong CI/local.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Cấu hình next/image để cho phép load ảnh từ nhiều domain.
  //
  // Whitelist hiện tại:
  // 1. cdn.vibemart.vn — mock CDN dùng cho dữ liệu giả lập khi
  //    `NEXT_PUBLIC_USE_MOCK=true` (xem plan 2026-10-15-fix-runtime-console-issues).
  // 2. lh3.googleusercontent.com — Google avatar URL trả về từ OAuth2.
  // 3. vibe-mart-utc2.canluaz.io.vn — production domain. Khi backend trả
  //    `imageUrl` dạng relative (vd "/banners/hero-1.jpg", "/users/1/avatar.png"),
  //    `src/features/homepage/api.ts` ghép với `NEXT_PUBLIC_API_URL` để thành
  //    absolute URL trỏ về hostname này. Next.js cần whitelist để tối ưu
  //    ảnh qua `/_next/image`.
  //
  // Khi thêm domain thật mới, cập nhật hostname tại đây.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.vibemart.vn",
        pathname: "/users/**",
      },
      {
        protocol: "https",
        hostname: "cdn.vibemart.vn",
        pathname: "/banners/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "vibe-mart-utc2.canluaz.io.vn",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
