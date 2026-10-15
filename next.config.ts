import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Cấu hình next/image để cho phép load ảnh từ backend CDN.
  // Backend Spring Boot trả UserResponse.avatarUrl kiểu
  // "https://cdn.vibemart.vn/users/<id>/avatar.png" và banner slides
  // kiểu "https://cdn.vibemart.vn/banners/hero-1.jpg". Khi thêm domain
  // thật, cập nhật hostname tại đây.
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
    ],
  },
};

export default withNextIntl(nextConfig);
