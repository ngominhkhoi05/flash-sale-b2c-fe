import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminTopbar } from "./AdminTopbar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

const mockLogout = vi.fn();
vi.mock("@/features/auth/hooks", () => ({
  useMeQuery: () => ({
    data: {
      id: 1,
      fullName: "Trần Quản Trị",
      email: "admin@vibemarket.vn",
    },
  }),
  useLogoutMutation: () => ({
    mutate: mockLogout,
    isPending: false,
  }),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: {
        id: "1",
        fullName: "Trần Quản Trị",
        email: "admin@vibemarket.vn",
        role: "ADMIN",
      },
    }),
}));

describe("AdminTopbar", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AdminTopbar />
      </QueryClientProvider>
    );

  it("hiển thị chuông thông báo và menu quản trị viên", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Thông báo hệ thống" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menu quản trị viên" })).toBeInTheDocument();
    expect(screen.getByText("Trần Quản Trị")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("mở menu thông báo khi nhấn vào chuông", async () => {
    renderComponent();
    const bellBtn = screen.getByRole("button", { name: "Thông báo hệ thống" });
    fireEvent.keyDown(bellBtn, { key: "Enter", code: "Enter" });

    expect(await screen.findByText("14 SKU chờ phê duyệt")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ gian hàng mới")).toBeInTheDocument();
  });

  it("mở menu tài khoản khi nhấn vào profile quản trị viên và click Đăng xuất", async () => {
    renderComponent();
    const profileBtn = screen.getByRole("button", { name: "Menu quản trị viên" });
    fireEvent.keyDown(profileBtn, { key: "Enter", code: "Enter" });

    expect(await screen.findByText("Phân quyền & tính năng")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ cá nhân")).toBeInTheDocument();

    const logoutBtn = screen.getByText("Đăng xuất");
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
