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
  // Cấu hình next/image để cho phép load ảnh avatar user từ backend CDN.
  // Backend Spring Boot trả UserResponse.avatarUrl kiểu
  // "https://cdn.vibemart.vn/users/<id>/avatar.png" (giả định). Khi thêm
  // domain thật, cập nhật hostname tại đây.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.vibemart.vn",
        pathname: "/users/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
