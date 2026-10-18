/**
 * Test: next.config.ts must whitelist `localhost` for next/image.
 *
 * Background (2026-10-18 incident):
 * - Khi chạy `npm run dev`, NEXT_PUBLIC_API_URL = http://localhost:8080
 * - `src/features/homepage/api.ts` ghép relative `imageUrl` (/banners/...)
 *   với base URL → thành http://localhost:8080/banners/...
 * - HeroBannerSection render <Image src="http://localhost:8080/..."> →
 *   Next.js throw vì hostname không có trong images.remotePatterns.
 *
 * Why this test exists:
 * - next.config.ts không nằm trong src/** nên coverage không bắt được.
 * - Test này là regression guard: nếu ai xoá entry localhost,
 *   test fail ngay → không lặp lại bug ở session mới.
 * - File này ở root (không trong src/) vì Vitest config mặc định
 *   chỉ scan src/**, nhưng ta explicitly include root file qua
 *   vitest.config.ts mở rộng.
 */
import { describe, it, expect } from 'vitest';
import nextConfig from './next.config';

describe('next.config.ts — images.remotePatterns', () => {
  const remotePatterns = nextConfig.images?.remotePatterns ?? [];

  const findPattern = (hostname: string, port?: string) =>
    remotePatterns.find(
      (p) => p.hostname === hostname && (!port || p.port === port)
    );

  it('whitelists localhost:8080 (dev backend)', () => {
    const pattern = findPattern('localhost', '8080');
    expect(pattern).toBeDefined();
    expect(pattern?.protocol).toBe('http');
    expect(pattern?.pathname).toBe('/**');
  });

  it('whitelists 127.0.0.1:8080 (dev backend IPv4 fallback)', () => {
    const pattern = findPattern('127.0.0.1', '8080');
    expect(pattern).toBeDefined();
    expect(pattern?.protocol).toBe('http');
    expect(pattern?.pathname).toBe('/**');
  });

  it('still keeps production hostname vibe-mart-utc2.canluaz.io.vn', () => {
    const pattern = findPattern('vibe-mart-utc2.canluaz.io.vn');
    expect(pattern).toBeDefined();
    expect(pattern?.protocol).toBe('https');
  });

  it('still keeps cdn.vibemart.vn for mock CDN', () => {
    const pattern = findPattern('cdn.vibemart.vn');
    expect(pattern).toBeDefined();
  });

  it('still keeps lh3.googleusercontent.com for Google OAuth avatars', () => {
    const pattern = findPattern('lh3.googleusercontent.com');
    expect(pattern).toBeDefined();
  });

  it('still keeps picsum.photos for placeholder images', () => {
    const pattern = findPattern('picsum.photos');
    expect(pattern).toBeDefined();
  });
});
