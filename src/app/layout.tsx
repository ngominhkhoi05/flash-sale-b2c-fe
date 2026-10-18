import type { Metadata, Viewport } from "next";
import { Providers } from "@/providers/Providers";
import { defaultSeo } from "@/config/seo.config";
import I18nProvider from "./I18nProvider";
import "./globals.css";

/**
 * Be Vietnam Pro & Material Symbols – load qua Google Fonts CDN link trong <head>.
 * Tránh lỗi Turbopack build timeout khi tải Google font trên local network.
 */
const beVietnamVariable = "font-sans";

export const metadata: Metadata = {
  title: {
    default: defaultSeo.title,
    template: `%s | ${defaultSeo.siteName}`,
  },
  description: defaultSeo.description,
  keywords: defaultSeo.keywords,
  openGraph: {
    title: defaultSeo.title,
    description: defaultSeo.description,
    siteName: defaultSeo.siteName,
    locale: defaultSeo.locale,
    images: [
      {
        url: defaultSeo.ogImage,
        alt: defaultSeo.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSeo.title,
    description: defaultSeo.description,
    images: [defaultSeo.ogImage],
    ...(defaultSeo.twitterHandle
      ? { creator: defaultSeo.twitterHandle }
      : {}),
  },
  icons: {
    icon: "/images/vibe-mart-logo-mark-light.png",
  },
  // Không set metadataBase cố định: Next.js tự suy ra từ request URL ở runtime.
  // Trước đây set new URL(NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
  // → throw "Invalid URL" khi path metadata chứa ký tự lạ và base trỏ localhost.
  // Xem https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: defaultSeo.themeColor,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: browser extension (Katalon Recorder, ColorZilla,
    // ad-blocker, ...) có thể tự inject attribute vào <html> SAU khi Next.js
    // stream HTML xong, TRƯỚC khi React hydrate. Flag này chỉ áp dụng cho
    // <html> element (không phải children), bỏ qua warning về attr lạ trên
    // <html>. Trade-off: mọi attr thêm vào <html> (extension, dev tool) đều
    // bị ignore khi so sánh hydrate – chấp nhận được vì <html> không nên
    // chứa runtime state.
    <html
      lang="vi"
      className="h-full antialiased font-sans"
      suppressHydrationWarning
    >
      <head>
        {/* Google Fonts Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* Be Vietnam Pro – Primary font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols Outlined – Google Fonts (Stitch icon system) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface font-sans min-h-screen flex flex-col">
        <Providers>
          <I18nProvider>{children}</I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
