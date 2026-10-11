import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { HeroBannerSection } from "./HeroBannerSection";
import viMessages from "../../../../messages/vi.json";

const messages = viMessages as unknown as Record<string, unknown>;

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("HeroBannerSection (image-bg click-through)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the carousel region with the i18n label", () => {
    renderWithIntl(<HeroBannerSection />);
    const region = screen.getByRole("region", { name: /banner/i });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("renders all 4 slides (one is visible, three are hidden)", () => {
    const { container } = renderWithIntl(<HeroBannerSection />);
    const slides = container.querySelectorAll('[data-testid^="hero-slide-"]');
    expect(slides.length).toBe(4);
  });

  it("slide 0 is visible initially (opacity-100, z-10)", () => {
    const { container } = renderWithIntl(<HeroBannerSection />);
    const slide0 = container.querySelector('[data-testid="hero-slide-0"]');
    expect(slide0?.className).toContain("opacity-100");
    expect(slide0?.className).toContain("z-10");
  });

  it("other slides start hidden (opacity-0)", () => {
    const { container } = renderWithIntl(<HeroBannerSection />);
    const slide1 = container.querySelector('[data-testid="hero-slide-1"]');
    expect(slide1?.className).toContain("opacity-0");
  });

  it("renders 4 carousel dots, the first is active", () => {
    const { container } = renderWithIntl(<HeroBannerSection />);
    const dots = container.querySelectorAll('[data-testid^="hero-dot-"]');
    expect(dots.length).toBe(4);
    const dot0 = container.querySelector('[data-testid="hero-dot-0"]');
    expect(dot0?.getAttribute("aria-current")).toBe("true");
  });

  it("clicking a dot activates the corresponding slide", () => {
    const { container } = renderWithIntl(<HeroBannerSection />);
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
    const { container } = renderWithIntl(<HeroBannerSection />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    const slide1 = container.querySelector('[data-testid="hero-slide-1"]');
    expect(slide1?.className).toContain("opacity-100");
  });

  it("pauses auto-advance on mouseenter, resumes on mouseleave", () => {
    const { container } = renderWithIntl(<HeroBannerSection />);
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

    const { container } = renderWithIntl(<HeroBannerSection />);
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    const slide0 = container.querySelector('[data-testid="hero-slide-0"]');
    expect(slide0?.className).toContain("opacity-100");
  });

  it("renders 1 active slide as a navigable link pointing to slide 0 ctaHref", () => {
    renderWithIntl(<HeroBannerSection />);
    // The currently-active slide is rendered as a Link (click-through).
    // aria-label is "Slide 1 / 4" (current / total).
    const activeLink = screen.getByRole("link", { name: /slide 1 \/ 4/i });
    expect(activeLink).toHaveAttribute("href", "/flash-sale");
  });

  it("clicking dot 2 makes slide 2 the active navigable link", () => {
    const { container } = renderWithIntl(<HeroBannerSection />);
    const dot2 = container.querySelector(
      '[data-testid="hero-dot-2"]'
    ) as HTMLElement;
    act(() => {
      fireEvent.click(dot2);
    });
    // After click, the active link should be slide 3 with /kho-voucher href
    const activeLink = screen.getByRole("link", { name: /slide 3 \/ 4/i });
    expect(activeLink).toHaveAttribute("href", "/kho-voucher");
  });

  it("does NOT render any heading text (h1/h2) inside the hero region — text is gone", () => {
    renderWithIntl(<HeroBannerSection />);
    const region = screen.getByRole("region", { name: /banner/i });
    const headings = region.querySelectorAll("h1, h2, h3, p");
    expect(headings.length).toBe(0);
  });

  it("uses the imageUrl as a full-bleed background image on each slide", () => {
    const { container } = renderWithIntl(<HeroBannerSection />);
    const slide0 = container.querySelector(
      '[data-testid="hero-slide-0"]'
    ) as HTMLElement;
    // Each slide has a <img> as the background, taking the whole slide area
    const img = slide0.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toMatch(/^https:\/\/lh3\.googleusercontent\.com/);
  });
});
