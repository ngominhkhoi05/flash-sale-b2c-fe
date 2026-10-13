import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import XacThucEmailPage from "./page";
import { TestWrapper } from "@/__tests__/test-wrapper";

// Mock next/navigation
const mockUseSearchParams = vi.fn<() => URLSearchParams>(
  () => new URLSearchParams()
);
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

// Mock auth store
const mockUseAuthStore = vi.fn();
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    mockUseAuthStore(selector),
}));

function withQueryClient(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <TestWrapper>{ui}</TestWrapper>
    </QueryClientProvider>
  );
}

describe("XacThucEmailPage (verify-email)", () => {
  it("render AuthBrandPanel + VerifyEmailForm", () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { user: null }) => unknown) => selector({ user: null })
    );
    withQueryClient(<XacThucEmailPage />);
    expect(screen.getByTestId("auth-brand-panel")).toBeInTheDocument();
    expect(screen.getByTestId("verify-email-form")).toBeInTheDocument();
  });

  it("đọc email từ query param và mask hiển thị", () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { user: null }) => unknown) => selector({ user: null })
    );
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("email=an.nguyen@gmail.com")
    );
    withQueryClient(<XacThucEmailPage />);
    const masked = screen.getByTestId("masked-email");
    expect(masked.textContent).toBe("an***@gmail.com");
  });

  it("hiển thị email placeholder khi không có query param", () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { user: null }) => unknown) => selector({ user: null })
    );
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    withQueryClient(<XacThucEmailPage />);
    const masked = screen.getByTestId("masked-email");
    expect(masked.textContent).toBe("email của bạn");
  });
});
