import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
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
