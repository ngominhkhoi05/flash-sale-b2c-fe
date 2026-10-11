/**
 * Unit tests cho StorefrontHeader.
 * - Nav pills: active state detection theo pathname
 * - Rendering: sections hiển thị đúng (không strict text match)
 * - Cart count badge: hiển thị theo useCartCount
 *
 * Không test snapshot (pixel-match) — nằm ở page-level HomepageView test.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StorefrontHeader } from "./StorefrontHeader";
import { TestWrapper } from "@/__tests__/test-wrapper";

const mockUsePathname = vi.fn(() => "/trang-chu");
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
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
    mockUsePathname.mockReturnValue("/trang-chu");
  });

  it("highlights Trang chủ pill when pathname is /trang-chu", () => {
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

  it("highlights Voucher nav item when pathname is /kho-voucher", () => {
    mockUsePathname.mockReturnValue("/kho-voucher");
    withProviders(<StorefrontHeader />);
    // Verify that at least one nav pill gets aria-current on /kho-voucher
    const pillsWithAriaCurrent = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(pillsWithAriaCurrent.length).toBeGreaterThan(0);
  });

  it("activeNav prop overrides pathname detection", () => {
    mockUsePathname.mockReturnValue("/trang-chu");
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
});

describe("StorefrontHeader – renders all sections", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/trang-chu");
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

  it("renders multiple nav pills (at least 5)", () => {
    withProviders(<StorefrontHeader />);
    const pills = screen.getAllByRole("link");
    expect(pills.length).toBeGreaterThanOrEqual(5);
  });

  it("renders 6 nav pills with CONSISTENT font-weight (label-lg = 14px/600)", () => {
    // docs/CLAUDE.md §3 spec: label-lg = 14px/600.
    // Trước đây 5 items dùng text-label-lg (no weight) + 1 item Flash Sale có
    // font-bold (700) → visual không đều. Sau fix, tất cả 6 items phải dùng
    // font-semibold (600) để đồng nhất theo spec.
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
      .map((label) =>
        screen.getAllByRole("link").find((l) => l.textContent?.includes(label))
      )
      .filter((p): p is HTMLElement => p !== undefined);
    expect(pills).toHaveLength(6);
    const classes = pills.map((p) => p.className);
    // Mỗi pill phải có font-semibold
    pills.forEach((p, i) => {
      expect(classes[i]).toMatch(/font-semibold/);
    });
    // Không được có font-bold hoặc font-medium (giữ nguyên semantic spec)
    pills.forEach((p) => {
      expect(p.className).not.toMatch(/font-bold/);
      expect(p.className).not.toMatch(/font-medium/);
    });
  });
});

// ── User avatar / login button ──────────────────────────────────────────
describe("StorefrontHeader – user area", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/trang-chu");
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

  it("renders Đăng nhập link when NOT authenticated (linking to /dang-nhap)", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    });
    withProviders(<StorefrontHeader />);
    const loginLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href") === "/dang-nhap");
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
      .filter((l) => l.getAttribute("href") === "/dang-nhap");
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
    expect(src).toMatch(/\/images\/default-avatar(\.png|\.svg)/);
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
    expect(logoImg?.getAttribute("width")).toBe("128");
    expect(logoImg?.getAttribute("height")).toBe("36");
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
    mockUsePathname.mockReturnValue("/trang-chu");
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
