/**
 * Unit test cho RootLayout (src/app/layout.tsx).
 *
 * Verify:
 * 1. <html> có `suppressHydrationWarning` để ignore extension-injected attrs
 *    (vd: Katalon Recorder thêm `katalonextensionid` vào <html>).
 * 2. Layout render Providers + I18nProvider + children.
 *
 * Lý do cần suppressHydrationWarning:
 * Browser extension như Katalon Recorder / ColorZilla / ... tự inject
 * attribute vào <html> SAU khi Next.js stream HTML xong, TRƯỚC khi React
 * hydrate. React sẽ cảnh báo "A tree hydrated but some attributes...".
 * Thêm suppressHydrationWarning lên <html> (chỉ element đó, không phải
 * children) sẽ bỏ qua warning này.
 *
 * Test approach: vì jsdom không cho phép `<html>` render trong 1 root `<div>`,
 * ta dùng ReactDOM.render trực tiếp vào document.documentElement qua portal.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createPortal } from "react-dom";
import RootLayout from "./layout";

// Mock next/font/google (Be_Vietnam_Pro) – trả về object có .variable
vi.mock("next/font/google", () => ({
  Be_Vietnam_Pro: () => ({
    variable: "be_vietnam_pro_test_variable",
  }),
}));

// Mock Providers – tránh pull QueryClient, WS connection, ...
vi.mock("@/providers/Providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-providers">{children}</div>
  ),
}));

// Mock I18nProvider – tránh pull next-intl server
vi.mock("./I18nProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-i18n">{children}</div>
  ),
}));

/**
 * LayoutRoot: wrap RootLayout trong portal để render <html> trực tiếp
 * vào document.documentElement. Tránh jsdom warning về nested <html>.
 */
function LayoutRoot({ children }: { children: React.ReactNode }) {
  return createPortal(
    <RootLayout>{children}</RootLayout>,
    document.documentElement,
  );
}

describe("RootLayout – hydration mismatch defense", () => {
  beforeEach(() => {
    // Clean any leftover attrs from previous test
    document.documentElement.removeAttribute("katalonextensionid");
    document.documentElement.removeAttribute("data-extension-injected");
    // Reset className (font variable từ test trước)
    document.documentElement.className = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("<html> có suppressHydrationWarning để chặn extension-injected attrs", () => {
    render(
      <LayoutRoot>
        <div data-testid="child">test</div>
      </LayoutRoot>,
    );
    const html = document.documentElement;
    expect(html).toBeTruthy();
    expect(html.getAttribute("lang")).toBe("vi");
    // Font variable className vẫn được apply
    expect(html.className).toContain("be_vietnam_pro_test_variable");

    // React lưu internal flag suppressHydrationWarning dưới key
    // `__reactProps$<hash>$suppressHydrationWarning` trên DOM element
    // (xem ReactDOMComponent.js trong React source). Khi flag được set,
    // React DOM Component sẽ skip so sánh attribute khi hydrate.
    // Trong React 19, internal key là một Symbol đặc biệt – tìm bằng
    // cách scan các React-internal property của element.
    const hasSuppressFlag = findReactSuppressHydrationWarning(html);
    expect(
      hasSuppressFlag,
      "Expected <html> to have suppressHydrationWarning prop set (để chặn extension-injected attrs gây hydration mismatch)",
    ).toBe(true);
  });

  it("không log hydration warning khi extension inject attr vào <html>", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <LayoutRoot>
        <div>test</div>
      </LayoutRoot>,
    );

    // Sanity: flag phải được set
    expect(findReactSuppressHydrationWarning(document.documentElement)).toBe(
      true,
    );

    // Simulate browser extension inject attr SAU khi React render
    document.documentElement.setAttribute(
      "katalonextensionid",
      "hdodkejagjkdomgbiioijegfmiiknoam",
    );

    // Force re-render (simulate React reconcile phase)
    render(
      <LayoutRoot>
        <div>test 2</div>
      </LayoutRoot>,
    );

    // Verify React KHÔNG log "Hydration failed" / "did not match" warning
    // liên quan đến attribute katalonextensionid trên <html>.
    const hydrationCalls = consoleErrorSpy.mock.calls.filter((args) => {
      const message = args
        .map((a) => (typeof a === "string" ? a : ""))
        .join(" ");
      return (
        message.includes("Hydration") ||
        message.includes("hydration") ||
        message.includes("did not match") ||
        message.includes("server rendered HTML")
      );
    });
    expect(hydrationCalls).toEqual([]);

    consoleErrorSpy.mockRestore();
  });

  it("render children trong <body> qua Providers + I18nProvider", () => {
    const { getByTestId } = render(
      <LayoutRoot>
        <span data-testid="child-content">hello world</span>
      </LayoutRoot>,
    );

    // Mocked Providers + I18nProvider wrap everything
    expect(getByTestId("mock-providers")).toBeInTheDocument();
    expect(getByTestId("mock-i18n")).toBeInTheDocument();
    expect(getByTestId("child-content")).toBeInTheDocument();
  });
});

/**
 * Tìm React-internal prop `suppressHydrationWarning` trên DOM element.
 *
 * React 19 lưu props dưới key `__reactProps$<hash>` (hash phụ thuộc vào
 * build). Helper này scan tất cả property trên element có tên bắt đầu
 * bằng `__reactProps$` và check xem có `suppressHydrationWarning: true`.
 *
 * Nếu React đổi cách lưu internal key, helper này cần update.
 * Đây là best-effort – tốt hơn cách cũ làm giả lập warning.
 */
function findReactSuppressHydrationWarning(el: HTMLElement): boolean {
  const reactPropKey = Object.getOwnPropertyNames(el).find((k) =>
    k.startsWith("__reactProps$"),
  );
  if (!reactPropKey) return false;
  const props = (el as unknown as Record<string, unknown>)[reactPropKey] as
    | Record<string, unknown>
    | undefined;
  return props?.suppressHydrationWarning === true;
}
