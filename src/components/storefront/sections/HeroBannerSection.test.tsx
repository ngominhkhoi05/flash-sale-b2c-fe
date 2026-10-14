import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { HeroBannerSection } from "./HeroBannerSection";
import viMessages from "../../../../messages/vi.json";
import type { HomeBannersResponse } from "@/features/homepage/api";

const messages = viMessages as unknown as Record<string, unknown>;

// Mock useHomeBanners hook
const mockBanners: { value: HomeBannersResponse | undefined } = {
  value: {
    mainSlides: [
      { id: 1, type: "HERO", position: 1, imageUrl: "https://example.com/s1.jpg", imageAlt: "Slide 1", ctaHref: "/flash-sale", ctaText: "Mua ngay", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
      { id: 2, type: "HERO", position: 2, imageUrl: "https://example.com/s2.jpg", imageAlt: "Slide 2", ctaHref: "/vouchers", ctaText: "Nhận voucher", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
      { id: 3, type: "HERO", position: 3, imageUrl: "https://example.com/s3.jpg", imageAlt: "Slide 3", ctaHref: "/products", ctaText: "Xem", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
      { id: 4, type: "HERO", position: 4, imageUrl: "https://example.com/s4.jpg", imageAlt: "Slide 4", ctaHref: "/flash-sale", ctaText: "Xem", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
    ],
    sideBanners: [
      { id: 5, type: "FREESHIP", position: 1, imageUrl: "https://example.com/fs.jpg", imageAlt: "Freeship", ctaHref: "/vouchers?type=freeship", ctaText: "Xem ngay", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
      { id: 6, type: "VOUCHER_NEW_SHOP", position: 2, imageUrl: "https://example.com/vs.jpg", imageAlt: "Voucher shop", ctaHref: "/vouchers?filter=new-shop", ctaText: "Lấy mã", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
    ],
  },
};

vi.mock("@/features/homepage/hooks", () => ({
  useHomeBanners: () => ({
    data: mockBanners.value,
    isLoading: false,
    isError: false,
  }),
  useFeaturedProducts: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

function makeQueryClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // Pre-seed QueryClient with mock data so component renders without network
  client.setQueryData(["homepage", "banners"], mockBanners.value);
  return client;
}

function renderWithProviders(ui: React.ReactNode) {
  const client = makeQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="vi" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

describe("HeroBannerSection (API-driven)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockBanners.value = {
      mainSlides: [
        { id: 1, type: "HERO", position: 1, imageUrl: "https://example.com/s1.jpg", imageAlt: "Slide 1", ctaHref: "/flash-sale", ctaText: "Mua ngay", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
        { id: 2, type: "HERO", position: 2, imageUrl: "https://example.com/s2.jpg", imageAlt: "Slide 2", ctaHref: "/vouchers", ctaText: "Nhận voucher", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
        { id: 3, type: "HERO", position: 3, imageUrl: "https://example.com/s3.jpg", imageAlt: "Slide 3", ctaHref: "/flash-sale", ctaText: "Xem", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
        { id: 4, type: "HERO", position: 4, imageUrl: "https://example.com/s4.jpg", imageAlt: "Slide 4", ctaHref: "/flash-sale", ctaText: "Xem", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
      ],
      sideBanners: [
        { id: 5, type: "FREESHIP", position: 1, imageUrl: "https://example.com/fs.jpg", imageAlt: "Freeship", ctaHref: "/vouchers?type=freeship", ctaText: "Xem ngay", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
        { id: 6, type: "VOUCHER_NEW_SHOP", position: 2, imageUrl: "https://example.com/vs.jpg", imageAlt: "Voucher shop", ctaHref: "/vouchers?filter=new-shop", ctaText: "Lấy mã", isActive: true, startDate: null, endDate: null, createdAt: "2026-01-01" },
      ],
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the carousel region with the i18n label", () => {
    renderWithProviders(<HeroBannerSection />);
    const region = screen.getByRole("region", { name: /banner/i });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("renders all 4 slides from API", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    const slides = container.querySelectorAll('[data-testid^="hero-slide-"]');
    expect(slides.length).toBe(4);
  });

  it("slide 0 is visible initially (opacity-100, z-10)", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    const slide0 = container.querySelector('[data-testid="hero-slide-0"]');
    expect(slide0?.className).toContain("opacity-100");
    expect(slide0?.className).toContain("z-10");
  });

  it("other slides start hidden (opacity-0)", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    const slide1 = container.querySelector('[data-testid="hero-slide-1"]');
    expect(slide1?.className).toContain("opacity-0");
  });

  it("renders 4 carousel dots, the first is active", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    const dots = container.querySelectorAll('[data-testid^="hero-dot-"]');
    expect(dots.length).toBe(4);
    const dot0 = container.querySelector('[data-testid="hero-dot-0"]');
    expect(dot0?.getAttribute("aria-current")).toBe("true");
  });

  it("clicking a dot activates the corresponding slide", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    const dot2 = container.querySelector(
      '[data-testid="hero-dot-2"]'
    ) as HTMLElement;
    act(() => {
      fireEvent.click(dot2);
    });
    const slide2 = container.querySelector('[data-testid="hero-slide-2"]');
    expect(slide2?.className).toContain("opacity-100");
    expect(dot2.getAttribute("aria-current")).toBe("true");
  });

  it("auto-advances after 5s", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    const slide1 = container.querySelector('[data-testid="hero-slide-1"]');
    expect(slide1?.className).toContain("opacity-100");
  });

  it("pauses auto-advance on mouseenter, resumes on mouseleave", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    const region = screen.getByRole("region", { name: /banner/i });

    act(() => {
      fireEvent.mouseEnter(region);
    });
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    const slide0 = container.querySelector('[data-testid="hero-slide-0"]');
    expect(slide0?.className).toContain("opacity-100");

    act(() => {
      fireEvent.mouseLeave(region);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    const slide1 = container.querySelector('[data-testid="hero-slide-1"]');
    expect(slide1?.className).toContain("opacity-100");
  });

  it("respects prefers-reduced-motion: no auto-advance", () => {
    const matchMediaMock = vi.fn().mockImplementation(
      (query: string) =>
        ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList
    );
    window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;

    const { container } = renderWithProviders(<HeroBannerSection />);
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    const slide0 = container.querySelector('[data-testid="hero-slide-0"]');
    expect(slide0?.className).toContain("opacity-100");
  });

  it("renders 1 active slide as a navigable link pointing to slide 0 ctaHref", () => {
    renderWithProviders(<HeroBannerSection />);
    const slide0 = document.querySelector('[data-testid="hero-slide-0"]') as HTMLElement;
    expect(slide0).toBeTruthy();
    expect(slide0.tagName).toBe("A");
    expect(slide0.getAttribute("href")).toBe("/flash-sale");
  });

  it("clicking dot 2 makes slide 2 the active navigable link", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    const dot2 = container.querySelector(
      '[data-testid="hero-dot-2"]'
    ) as HTMLElement;
    act(() => {
      fireEvent.click(dot2);
    });
    // After click, the active link should be slide 3 (idx=2) with /flash-sale href
    const activeLink = container.querySelector('[data-testid="hero-slide-2"]') as HTMLElement;
    expect(activeLink).toBeTruthy();
    expect(activeLink.tagName).toBe("A");
    expect(activeLink.getAttribute("href")).toBe("/flash-sale");
  });

  it("uses a full-bleed background image on each slide (https URL)", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    const slide0 = container.querySelector(
      '[data-testid="hero-slide-0"]'
    ) as HTMLElement;
    const img = slide0.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toMatch(/^https:\/\//);
  });

  it("renders 4 DISTINCT images (no copy-paste URL bug)", () => {
    const { container } = renderWithProviders(<HeroBannerSection />);
    const imgs = container.querySelectorAll('[data-testid^="hero-slide-"] img');
    expect(imgs.length).toBe(4);
    const srcs = Array.from(imgs).map((img) => img.getAttribute("src") ?? "");
    const uniqueSrcs = new Set(srcs);
    expect(uniqueSrcs.size).toBe(4);
  });

  it("renders nothing when banners data is empty", () => {
    mockBanners.value = { mainSlides: [], sideBanners: [] };
    const { container } = render(
      <QueryClientProvider client={makeQueryClient()}>
        <NextIntlClientProvider locale="vi" messages={messages}>
          <HeroBannerSection />
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
    const slides = container.querySelectorAll('[data-testid^="hero-slide-"]');
    expect(slides.length).toBe(0);
  });
});
