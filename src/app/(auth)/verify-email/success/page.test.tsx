import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import SuccessPage from "./page";
import { TestWrapper } from "@/__tests__/test-wrapper";

// Mock next/navigation
const mockSearchParamsGet = vi.fn(() => "an.nguyen@gmail.com");
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) =>
      key === "email" ? mockSearchParamsGet() : null,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
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

describe("/verify-email/success page", () => {
  it("render VerifyEmailSuccessCard với email từ searchParams", () => {
    withQueryClient(<SuccessPage />);
    expect(screen.getByTestId("success-title")).toBeInTheDocument();
    // Email từ searchParams
    const desc = screen.getByTestId("success-description");
    expect(desc.textContent).toContain("an***@gmail.com");
  });

  it("render AuthBrandPanel ở cột trái", () => {
    withQueryClient(<SuccessPage />);
    expect(screen.getByTestId("auth-brand-panel")).toBeInTheDocument();
  });
});
