/**
 * Unit tests cho StorefrontHeader.
 * - Nav pills: active state detection theo pathname
 * - Rendering: sections hiển thị đúng (không strict text match)
 * - Cart count badge: hiển thị theo useCartCount
 *
 * Không test snapshot (pixel-match) — nằm ở page-level HomepageView test.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StorefrontHeader } from "./StorefrontHeader";
import { TestWrapper } from "@/__tests__/test-wrapper";

const mockUsePathname = vi.fn(() => "/");
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  refresh: vi.fn(),
};
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => mockRouter,
}));

// Mock useAuth – mặc định chưa auth (cart count = 0)
// Lưu ý: trả về `unknown` để test không cần khai báo đủ tất cả field của
// useAuth return type – chỉ cần field mà component sử dụng.
const mockUseAuth = vi.fn<() => unknown>(() => ({
  user: null,
  role: undefined,
  isAuthenticated: false,
  isHydrated: true,
  setUser: vi.fn(),
  logout: vi.fn(),
  isBuyer: false,
  isSeller: false,
  isAdmin: false,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useCartCount – mặc định count=0 (cart rỗng / chưa auth)
const mockUseCartCount = vi.fn<() => unknown>(() => ({
  data: 0,
  isSuccess: true,
  isFetching: false,
}));
vi.mock("@/features/cart", () => ({
  useCartCount: () => mockUseCartCount(),
}));

function withProviders(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>,
  );
}

describe("StorefrontHeader – nav pill active detection", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("highlights Trang chủ pill when pathname is /", () => {
    withProviders(<StorefrontHeader />);
    const homeLink = screen.getAllByRole("link").find(
      (l) => l.textContent?.trim() === "Trang chủ"
    );
    expect(homeLink).toHaveAttribute("aria-current", "page");
  });

  it("highlights Flash Sale pill when pathname is /flash-sale", () => {
    mockUsePathname.mockReturnValue("/flash-sale");
    withProviders(<StorefrontHeader />);
    const flashLinks = screen.getAllByRole("link").filter((l) =>
      l.textContent?.includes("Flash Sale")
    );
    const flashPill = flashLinks.find((l) => l.getAttribute("aria-current") === "page");
    expect(flashPill).toBeDefined();
  });

  it("highlights Voucher nav item when pathname is /vouchers", () => {
    mockUsePathname.mockReturnValue("/vouchers");
    withProviders(<StorefrontHeader />);
    // Verify that at least one nav pill gets aria-current on /vouchers
    const pillsWithAriaCurrent = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(pillsWithAriaCurrent.length).toBeGreaterThan(0);
  });

  it("activeNav prop overrides pathname detection", () => {
    mockUsePathname.mockReturnValue("/");
    withProviders(<StorefrontHeader activeNav="flash-sale" />);
    const homeLink = screen
      .getAllByRole("link")
      .find((l) => l.textContent?.trim() === "Trang chủ");
    const flashLinks = screen.getAllByRole("link").filter((l) =>
      l.textContent?.includes("Flash Sale")
    );
    const flashPill = flashLinks.find(
      (l) => l.getAttribute("aria-current") === "page"
    );
    expect(homeLink).not.toHaveAttribute("aria-current", "page");
    expect(flashPill).toBeDefined();
  });

  it("does not highlight any nav item when pathname is a product detail page (e.g. /products/123)", () => {
    mockUsePathname.mockReturnValue("/products/123");
    withProviders(<StorefrontHeader />);
    const pillsWithAriaCurrent = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(pillsWithAriaCurrent).toHaveLength(0);

    const featuredLink = screen.getByRole("link", { name: /Thương hiệu nổi bật/i });
    expect(featuredLink).not.toHaveAttribute("aria-current");
    expect(featuredLink.className).not.toContain("bg-primary");

    const bestSellersLink = screen.getByRole("link", { name: /Bán chạy/i });
    expect(bestSellersLink).not.toHaveAttribute("aria-current");
    expect(bestSellersLink.className).not.toContain("bg-primary");
  });

  it("does not highlight any nav item when activeNav is null", () => {
    mockUsePathname.mockReturnValue("/");
    withProviders(<StorefrontHeader activeNav={null} />);
    const pillsWithAriaCurrent = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(pillsWithAriaCurrent).toHaveLength(0);
  });

  it("highlights Thương hiệu nổi bật when on /maintenance?feature=featured-brands", () => {
    mockUsePathname.mockReturnValue("/maintenance?feature=featured-brands");
    withProviders(<StorefrontHeader />);
    const link = screen.getByRole("link", { name: /Thương hiệu nổi bật/i });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link.className).toContain("bg-primary");
  });

  it("highlights Bán chạy when on /maintenance?feature=best-sellers", () => {
    mockUsePathname.mockReturnValue("/maintenance?feature=best-sellers");
    withProviders(<StorefrontHeader />);
    const link = screen.getByRole("link", { name: /Bán chạy/i });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link.className).toContain("bg-primary");
  });
});

describe("StorefrontHeader – renders all sections", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders the top bar with seller channel text", () => {
    withProviders(<StorefrontHeader />);
    // Top bar text is split across elements — check for partial text
    expect(screen.getByText(/kênh người bán/i)).toBeInTheDocument();
  });

  it("renders the search input", () => {
    withProviders(<StorefrontHeader />);
    // Input is a plain text input (not role=searchbox)
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("search form posts to /search (Subplan C of search-page-ui plan)", () => {
    withProviders(<StorefrontHeader />);
    // Lấy form chứa search input
    const input = screen.getAllByRole("textbox").find(
      (el) => (el as HTMLInputElement).name === "q",
    ) as HTMLInputElement | undefined;
    expect(input).toBeDefined();
    const form = input?.closest("form");
    expect(form).not.toBeNull();
    expect(form?.getAttribute("action")).toBe("/search");
    expect(form?.getAttribute("method")).toBe("get");
  });

  it("search icon link in compact variant also points to /search", () => {
    withProviders(<StorefrontHeader variant="compact" />);
    // Search icon button là link có aria-label = searchPlaceholder
    const link = screen.getByRole("link", { name: /Tìm sản phẩm/i });
    expect(link).toHaveAttribute("href", "/search");
  });

  it("renders multiple nav pills (at least 5)", () => {
    withProviders(<StorefrontHeader />);
    const pills = screen.getAllByRole("link");
    expect(pills.length).toBeGreaterThanOrEqual(5);
  });

  it("renders 6 nav pills with CONSISTENT text-label-lg + font-semibold", () => {
    // docs/CLAUDE.md §3 spec: label-lg = 14px/600.
    // Trước đây 5 items dùng text-label-lg (no weight) + 1 item Flash Sale có
    // font-bold (700) → visual không đều. Sau fix, tất cả 6 items phải dùng
    // text-label-lg (font-size 14px) + font-semibold (600) để đồng nhất
    // theo design system spec.
    //
    // Test này cũng guard chống ai đó vô tình bỏ class text-label-lg
    // (font-size) khỏi 1 nav-pill nào đó — bug mà user đã report qua
    // DevTools (có thể do browser cache CSS cũ hoặc thật sự thiếu).
    withProviders(<StorefrontHeader />);
    const navTextLabels = [
      "Trang chủ",
      "Flash Sale",
      "Hàng mới về",
      "Thương hiệu nổi bật",
      "Bán chạy",
      "Voucher & Khuyến mãi",
    ];
    const pills = navTextLabels
      .map((label) => {
        const matches = screen.getAllByRole("link").filter((l) =>
          l.textContent?.includes(label)
        );
        return matches[0];
      })
      .filter((p): p is HTMLElement => p !== undefined);
    expect(pills).toHaveLength(6);
    pills.forEach((p, i) => {
      // Mỗi pill PHẢI có text-label-lg (font-size 14px theo design token)
      expect(p.className, `pill[${i}] (${navTextLabels[i]}) missing text-label-lg`).toMatch(
        /text-label-lg/
      );
      // Mỗi pill PHẢI có font-semibold (weight 600 theo design token)
      expect(p.className, `pill[${i}] (${navTextLabels[i]}) missing font-semibold`).toMatch(
        /font-semibold/
      );
      // Không được có font-bold hoặc font-medium (giữ nguyên semantic spec)
      expect(p.className, `pill[${i}] (${navTextLabels[i]}) has font-bold`).not.toMatch(
        /font-bold/
      );
      expect(p.className, `pill[${i}] (${navTextLabels[i]}) has font-medium`).not.toMatch(
        /font-medium/
      );
    });
  });
});

// ── User avatar / login button ──────────────────────────────────────────
describe("StorefrontHeader – user area", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders the user greeting text when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: { id: "1", email: "u@e.com", fullName: "Minh Thư", role: "BUYER" },
    });
    withProviders(<StorefrontHeader />);
    expect(screen.getByText(/minh thư/i)).toBeInTheDocument();
  });

  it("does NOT render 'Thành viên VIP' badge even when authenticated", () => {
    // Badge 'Thành viên VIP' đã được loại bỏ khỏi header.
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: { id: "1", email: "u@e.com", fullName: "Minh Thư", role: "BUYER" },
    });
    withProviders(<StorefrontHeader />);
    expect(screen.queryByText(/thành viên vip/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/vip member/i)).not.toBeInTheDocument();
  });

  it("does NOT render greeting when NOT authenticated (shows login link instead)", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    });
    withProviders(<StorefrontHeader />);
    // Greeting phải bị ẩn
    expect(screen.queryByText(/minh thư/i)).not.toBeInTheDocument();
    // VIP badge cũng phải ẩn (vì chưa auth)
    expect(screen.queryByText(/thành viên vip/i)).not.toBeInTheDocument();
  });

  it("renders Đăng nhập link when NOT authenticated (linking to /login)", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    });
    withProviders(<StorefrontHeader />);
    const loginLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href") === "/login");
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it("does NOT render Đăng nhập link when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: { id: "1", email: "u@e.com", fullName: "Minh Thư", role: "BUYER" },
    });
    withProviders(<StorefrontHeader />);
    const loginLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href") === "/login");
    expect(loginLinks).toHaveLength(0);
  });

  it("uses local /images/vibe-mart-logo-lockup-light.png (not Google CDN URL) for the brand logo", () => {
    // Asset dùng cho logo header phải nằm local trong public/, không phụ thuộc
    // vào CDN ngoài (tránh link chết, vi phạm docs/CLAUDE.md mục 10).
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    });
    withProviders(<StorefrontHeader />);
    const imgs = Array.from(document.querySelectorAll("img"));
    const logoImg = imgs.find((img) => img.getAttribute("alt") === "Vibe Mart");
    expect(logoImg).toBeDefined();
    const src = logoImg?.getAttribute("src") ?? "";
    expect(src).toMatch(/\/images\/vibe-mart-logo-lockup-light(\.png|\.svg)/);
    expect(src).not.toMatch(/googleusercontent\.com/);
  });

  it("uses local /images/default-avatar.* for the default avatar when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: { id: "1", email: "u@e.com", fullName: "Minh Thư", role: "BUYER" },
    });
    withProviders(<StorefrontHeader />);
    const imgs = Array.from(document.querySelectorAll("img"));
    const avatarImg = imgs.find(
      (img) => img.getAttribute("alt") === "Ảnh đại diện mặc định",
    );
    expect(avatarImg).toBeDefined();
    const src = avatarImg?.getAttribute("src") ?? "";
    expect(src).toMatch(/\/images\/default-avatar(\.png|\.svg|\.jpg)/);
    expect(src).not.toMatch(/googleusercontent\.com/);
  });

  it("uses next/image (with explicit width/height) instead of raw <img>", () => {
    // next/image luôn render <img> với width và height attributes ngay cả
    // khi trong jsdom. Raw <img> chỉ có width/height nếu pass explicit prop.
    // Trong StorefrontHeader, raw <img> không có width/height → dấu hiệu phân
    // biệt rõ ràng.
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    });
    withProviders(<StorefrontHeader />);
    const imgs = Array.from(document.querySelectorAll("img"));
    const logoImg = imgs.find((img) => img.getAttribute("alt") === "Vibe Mart");
    expect(logoImg).toBeDefined();
    // next/image set width/height; raw <img> ở code cũ KHÔNG có
    // Width/height phải khớp tỉ lệ ảnh gốc (1024:307 ≈ 3.33:1) để tránh bị
    // browser scale giãn khi render. 120×40 = 3:1, gần với intrinsic ratio.
    expect(logoImg?.getAttribute("width")).toBe("120");
    expect(logoImg?.getAttribute("height")).toBe("40");
  });

  it("renders user.avatarUrl (when present) instead of the default avatar", () => {
    // Khi user đã upload avatar (backend trả avatarUrl), header phải hiển thị
    // ảnh đó thay vì fallback default. Alt phải là tên user (a11y tốt hơn).
    const AVATAR = "https://cdn.vibemart.vn/users/1/avatar.png";
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: {
        id: "1",
        email: "u@e.com",
        fullName: "Minh Thư",
        role: "BUYER",
        avatarUrl: AVATAR,
      },
    });
    withProviders(<StorefrontHeader />);
    const imgs = Array.from(document.querySelectorAll("img"));
    // Tìm avatar: có alt là tên user, src là URL backend
    const userAvatarImg = imgs.find(
      (img) => img.getAttribute("alt") === "Minh Thư",
    );
    expect(userAvatarImg).toBeDefined();
    const src = userAvatarImg?.getAttribute("src") ?? "";
    expect(src).toBe(AVATAR);
    // KHÔNG hiển thị default fallback khi có avatar thật
    const defaultAvatarImg = imgs.find(
      (img) => img.getAttribute("alt") === "Ảnh đại diện mặc định",
    );
    expect(defaultAvatarImg).toBeUndefined();
  });

  it("falls back to default avatar when user.avatarUrl is undefined", () => {
    // Khi user chưa upload avatar (avatarUrl undefined), header dùng
    // default SVG local. Trường hợp này đã cover ở test trên nhưng gom
    // rõ ràng để dễ đọc.
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: {
        id: "1",
        email: "u@e.com",
        fullName: "Minh Thư",
        role: "BUYER",
        // avatarUrl: undefined
      },
    });
    withProviders(<StorefrontHeader />);
    const imgs = Array.from(document.querySelectorAll("img"));
    const defaultAvatarImg = imgs.find(
      (img) => img.getAttribute("alt") === "Ảnh đại diện mặc định",
    );
    expect(defaultAvatarImg).toBeDefined();
    const src = defaultAvatarImg?.getAttribute("src") ?? "";
    expect(src).toMatch(/\/images\/default-avatar/);
  });
});

// ── Cart count badge ──────────────────────────────────────────────────────
describe("StorefrontHeader – cart count badge", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("does NOT render badge when count is 0", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
    });
    mockUseCartCount.mockReturnValue({ data: 0, isSuccess: true });
    withProviders(<StorefrontHeader />);
    expect(screen.queryByTestId("cart-count-badge")).not.toBeInTheDocument();
  });

  it("renders badge with count when count > 0", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
    });
    mockUseCartCount.mockReturnValue({ data: 5, isSuccess: true });
    withProviders(<StorefrontHeader />);
    const badge = screen.getAllByTestId("cart-count-badge")[0];
    expect(badge).toHaveTextContent("5");
  });

  it("renders 99+ when count > 99", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
    });
    mockUseCartCount.mockReturnValue({ data: 150, isSuccess: true });
    withProviders(<StorefrontHeader />);
    const badge = screen.getAllByTestId("cart-count-badge")[0];
    expect(badge).toHaveTextContent("99+");
  });
});

// ── Placeholder links: tất cả href="#" phải được gắn vào /maintenance ─────
//
// Sau khi gắn các placeholder UI (Tải app, Facebook, Zalo, Ngôn ngữ,
// Thông báo, Hãng nổi bật, Bán chạy, Trở thành người bán, search submit,
// account dropdown, danh mục) vào /maintenance?feature=<code>, MỌI link
// trong header KHÔNG được có href="#". Test này chống regression nếu
// ai đó vô tình thêm lại href="#" vào code mới.
describe("StorefrontHeader – placeholder links (no href='#')", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    });
    mockUseCartCount.mockReturnValue({ data: 0, isSuccess: true });
  });

  it("không có link nào có href='#' (unauthenticated)", () => {
    withProviders(<StorefrontHeader />);
    const links = screen.getAllByRole("link");
    const deadLinks = links.filter((l) => l.getAttribute("href") === "#");
    expect(deadLinks, `Found dead links: ${deadLinks.length}`).toHaveLength(0);
  });

  it("không có link nào có href='#' (authenticated)", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: {
        id: "1",
        email: "u@e.com",
        fullName: "Minh Thư",
        role: "BUYER",
      },
    });
    withProviders(<StorefrontHeader />);
    const links = screen.getAllByRole("link");
    const deadLinks = links.filter((l) => l.getAttribute("href") === "#");
    expect(deadLinks, `Found dead links: ${deadLinks.length}`).toHaveLength(0);
  });

  it("compact variant cũng không có href='#' (giỏ hàng/checkout)", () => {
    withProviders(<StorefrontHeader variant="compact" />);
    const links = screen.getAllByRole("link");
    const deadLinks = links.filter((l) => l.getAttribute("href") === "#");
    expect(deadLinks, `Found dead links: ${deadLinks.length}`).toHaveLength(0);
  });

  it("link Tải ứng dụng dẫn về /maintenance?feature=download-app", () => {
    withProviders(<StorefrontHeader />);
    const link = screen.getByRole("link", { name: /Tải ứng dụng/i });
    expect(link).toHaveAttribute("href", "/maintenance?feature=download-app");
  });

  it("link Thông báo dẫn về /maintenance?feature=notifications", () => {
    withProviders(<StorefrontHeader />);
    const link = screen.getByRole("link", { name: /Thông báo/i });
    expect(link).toHaveAttribute("href", "/maintenance?feature=notifications");
  });

  it("link Trở thành người bán dẫn về /maintenance?feature=seller-register", () => {
    withProviders(<StorefrontHeader />);
    const link = screen.getByRole("link", {
      name: /Trở thành Người bán Vibe Mart/i,
    });
    expect(link).toHaveAttribute("href", "/maintenance?feature=seller-register");
  });

  it("nav pill 'Hàng mới về' (Danh mục) dẫn về /maintenance?feature=category", () => {
    withProviders(<StorefrontHeader />);
    const link = screen.getByRole("link", { name: /Hàng mới về/i });
    expect(link).toHaveAttribute("href", "/maintenance?feature=category");
  });

  it("nav pill 'Thương hiệu nổi bật' dẫn về /maintenance?feature=featured-brands", () => {
    withProviders(<StorefrontHeader />);
    const link = screen.getByRole("link", { name: /Thương hiệu nổi bật/i });
    expect(link).toHaveAttribute("href", "/maintenance?feature=featured-brands");
  });

  it("nav pill 'Bán chạy' dẫn về /maintenance?feature=best-sellers", () => {
    withProviders(<StorefrontHeader />);
    const link = screen.getByRole("link", { name: /Bán chạy/i });
    expect(link).toHaveAttribute("href", "/maintenance?feature=best-sellers");
  });

  it("avatar trigger (khi auth) là button dropdown, không phải link", () => {
    // Sau khi thêm dropdown menu, click avatar mở menu (không phải link tới
    // /maintenance?feature=account-dropdown nữa). Test này chống regression
    // nếu ai đó vô tình đổi lại thành Link.
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: {
        id: "1",
        email: "u@e.com",
        fullName: "Minh Thư",
        role: "BUYER",
      },
    });
    withProviders(<StorefrontHeader />);
    // Trigger là button có aria-label "Mở menu người dùng" (định nghĩa trong i18n)
    const trigger = screen.getByRole("button", { name: /mở menu người dùng/i });
    expect(trigger).toBeInTheDocument();
    // KHÔNG còn link /maintenance?feature=account-dropdown
    const deadLink = screen
      .queryByRole("link", { name: /Minh Thư/i });
    expect(deadLink).not.toBeInTheDocument();
  });
});

// ── Logo: chống overflow khi CSS className override ──────────────────────
//
// Bug trước: <Image className="h-9 w-auto object-contain"> + 
// style={{ width: "auto", height: "auto" }} (set inline) → inline style thắng
// className → logo render theo intrinsic size (~1200×400 px) → phóng to chiếm
// gần hết header.
//
// Fix: bỏ inline style. next/image width/height props đã đủ cho intrinsic 120×40.
// className "h-9 w-auto object-contain" set height=36px, width=intrinsic (theo tỉ lệ).
describe("StorefrontHeader – logo overflow guard", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("logo <Image> KHÔNG có inline style override (style.width='auto' + style.height='auto' gây phóng to logo)", () => {
    // Test FAIL trên code cũ (commit db8b4c8 thêm style={{ width: 'auto', height: 'auto' }})
    // để enforce rằng inline style bị bỏ. next/image đã có width/height props 120/40
    // → chỉ cần className để override height bằng 36px.
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    });
    withProviders(<StorefrontHeader />);
    const imgs = Array.from(document.querySelectorAll("img"));
    const logoImg = imgs.find((img) => img.getAttribute("alt") === "Vibe Mart");
    expect(logoImg).toBeDefined();
    // Logo KHÔNG được có inline style.width='auto' + style.height='auto' (cấu hình cũ gây overflow)
    expect((logoImg as HTMLImageElement | undefined)?.style.width).not.toBe("auto");
    expect((logoImg as HTMLImageElement | undefined)?.style.height).not.toBe("auto");
  });

  it("logo <Image> có className 'h-9' (height=36px) để constrain chiều cao", () => {
    // Class "h-9" set height: 2.25rem (36px). Đây là constraint thực sự giữ logo
    // không phóng to. Nếu ai đó vô tình bỏ "h-9", test sẽ RED cảnh báo.
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    });
    withProviders(<StorefrontHeader />);
    const imgs = Array.from(document.querySelectorAll("img"));
    const logoImg = imgs.find((img) => img.getAttribute("alt") === "Vibe Mart");
    expect(logoImg).toBeDefined();
    // next/image render <img className="...">; class phải chứa "h-9"
    expect((logoImg as HTMLImageElement | undefined)?.className).toMatch(/h-9/);
  });
});

describe("StorefrontHeader – hide on scroll down, show immediately on scroll up", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 2000,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
  });

  it("header có data-visible='true' và class translate-y-0 khi vừa tải trang", () => {
    withProviders(<StorefrontHeader />);
    const header = document.querySelector("header");
    expect(header).toBeDefined();
    expect(header?.getAttribute("data-visible")).toBe("true");
    expect(header?.className).toContain("translate-y-0");
    expect(header?.className).not.toContain("-translate-y-full");
  });

  it("header ẩn đi (-translate-y-full, data-visible='false') khi lướt xuống qua threshold", () => {
    withProviders(<StorefrontHeader />);
    const header = document.querySelector("header");

    act(() => {
      window.scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(header?.getAttribute("data-visible")).toBe("false");
    expect(header?.className).toContain("-translate-y-full");
  });

  it("header hiện ngay lập tức (translate-y-0, data-visible='true') khi lướt lên", () => {
    withProviders(<StorefrontHeader />);
    const header = document.querySelector("header");

    // Lướt xuống
    act(() => {
      window.scrollY = 250;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header?.getAttribute("data-visible")).toBe("false");

    // Lướt lên ngay lập tức
    act(() => {
      window.scrollY = 240;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header?.getAttribute("data-visible")).toBe("true");
    expect(header?.className).toContain("translate-y-0");
  });

  it("compact variant cũng ẩn khi cuộn xuống và hiện khi cuộn lên", () => {
    withProviders(<StorefrontHeader variant="compact" />);
    const header = document.querySelector("header");

    act(() => {
      window.scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header?.getAttribute("data-visible")).toBe("false");
    expect(header?.className).toContain("-translate-y-full");

    act(() => {
      window.scrollY = 190;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header?.getAttribute("data-visible")).toBe("true");
    expect(header?.className).toContain("translate-y-0");
  });
});

