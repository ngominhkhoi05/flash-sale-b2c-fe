import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { VerifyEmailSuccessCard } from "./VerifyEmailSuccessCard";
import { TestWrapper } from "@/__tests__/test-wrapper";

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockRouterPush(...args),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

function withQueryClient(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mockRouterPush.mockReset();
  vi.useRealTimers();
});

describe("VerifyEmailSuccessCard", () => {
  it("render title 'Email đã được xác thực'", () => {
    withQueryClient(<VerifyEmailSuccessCard email="an.nguyen@gmail.com" />);
    expect(screen.getByTestId("success-title")).toHaveTextContent(
      "Email đã được xác thực"
    );
  });

  it("render email masked trong description", () => {
    withQueryClient(<VerifyEmailSuccessCard email="an.nguyen@gmail.com" />);
    const desc = screen.getByTestId("success-description");
    // an***@gmail.com
    expect(desc.textContent).toContain("an***@gmail.com");
  });

  it("render stepper 3 bước: bước 1 done, bước 2 done, bước 3 active", () => {
    withQueryClient(<VerifyEmailSuccessCard email="an@gmail.com" />);
    expect(screen.getByTestId("otp-step-0")).toHaveAttribute("data-state", "done");
    expect(screen.getByTestId("otp-step-1")).toHaveAttribute("data-state", "done");
    expect(screen.getByTestId("otp-step-2")).toHaveAttribute("data-state", "active");
  });

  it("render box tài khoản với email + badge 'Đã kích hoạt'", () => {
    withQueryClient(<VerifyEmailSuccessCard email="an.nguyen@gmail.com" />);
    const box = screen.getByTestId("success-account-box");
    expect(box).toBeInTheDocument();
    expect(box.textContent).toContain("an***@gmail.com");
    expect(box.textContent).toContain("Đã kích hoạt");
  });

  it("render nút primary 'Bắt đầu mua sắm' với href='/login'", () => {
    withQueryClient(<VerifyEmailSuccessCard email="an@gmail.com" />);
    const btn = screen.getByTestId("success-shop-now-button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("href", "/login");
  });

  it("render countdown 'Tự chuyển trang sau 5 giây' ban đầu", () => {
    withQueryClient(<VerifyEmailSuccessCard email="an@gmail.com" />);
    const countdown = screen.getByTestId("success-countdown");
    expect(countdown).toBeInTheDocument();
    expect(countdown.textContent).toMatch(/5\s*giây/);
  });

  it("sau 5s, gọi router.push('/login')", async () => {
    vi.useFakeTimers();
    withQueryClient(<VerifyEmailSuccessCard email="an@gmail.com" />);

    // Advance 5s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/login");
  });

  it("email rỗng: vẫn render với placeholder", () => {
    withQueryClient(<VerifyEmailSuccessCard email="" />);
    const desc = screen.getByTestId("success-description");
    expect(desc.textContent).toContain("email của bạn");
  });
});
