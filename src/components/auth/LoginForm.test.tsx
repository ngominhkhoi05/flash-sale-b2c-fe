/**
 * Test LoginForm — đọc `?error=google_*` từ URL và hiển thị toast.
 *
 * Flow khi user cancel Google OAuth:
 * 1. User bấm nút Google ở /login
 * 2. Google redirect về /auth/google/callback?error=access_denied
 * 3. Callback page redirect về /login?error=google_cancelled
 * 4. LoginForm useEffect đọc ?error → toast.error(t('error.google_cancelled'))
 * 5. User thấy message tiếng Việt cụ thể (vd "Bạn đã hủy đăng nhập bằng Google.")
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "./LoginForm";
import { TestWrapper } from "@/__tests__/test-wrapper";

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock sonner
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useLoginMutation để không gọi API
vi.mock("@/features/auth", async () => {
  const actual = await vi.importActual<typeof import("@/features/auth")>(
    "@/features/auth",
  );
  return {
    ...actual,
    useLoginMutation: () => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    }),
  };
});

function withQueryClient(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // Reset search params giữa các test
  mockSearchParams.delete("error");
  mockToastError.mockClear();
});

describe("LoginForm — đọc ?error=google_*", () => {
  it("toast.error với i18n key khi URL có ?error=google_cancelled", async () => {
    mockSearchParams.set("error", "google_cancelled");
    withQueryClient(<LoginForm />);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
    // Message phải là bản dịch tiếng Việt, KHÔNG phải raw "google_cancelled"
    const calledWith = String(mockToastError.mock.calls[0][0]);
    expect(calledWith).not.toBe("google_cancelled");
    expect(calledWith).toMatch(/Bạn đã hủy đăng nhập bằng Google/);
  });

  it("toast.error với i18n key khi URL có ?error=google_AUTH_502_GOOGLE_EXCHANGE", async () => {
    mockSearchParams.set("error", "google_AUTH_502_GOOGLE_EXCHANGE");
    withQueryClient(<LoginForm />);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
    const calledWith = String(mockToastError.mock.calls[0][0]);
    expect(calledWith).toMatch(/Không thể xác thực với Google/);
  });

  it("fallback về 'error.google_unknown' khi code không match (vd google_FOO_BAR)", async () => {
    mockSearchParams.set("error", "google_FOO_BAR");
    withQueryClient(<LoginForm />);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
    const calledWith = String(mockToastError.mock.calls[0][0]);
    expect(calledWith).toMatch(/Đăng nhập bằng Google thất bại/);
  });

  it("KHÔNG toast khi URL không có ?error=", async () => {
    // Mock searchParams rỗng
    withQueryClient(<LoginForm />);
    // Đợi 1 chút để effect chạy
    await new Promise((r) => setTimeout(r, 50));
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("KHÔNG toast khi ?error= không phải google_* (vd ?error=foo)", async () => {
    mockSearchParams.set("error", "foo");
    withQueryClient(<LoginForm />);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
