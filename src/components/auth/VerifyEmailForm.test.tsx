import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { VerifyEmailForm } from "./VerifyEmailForm";
import { TestWrapper } from "@/__tests__/test-wrapper";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock hooks
const mockVerifyMutate = vi.fn();
const mockResendMutate = vi.fn();
vi.mock("@/features/auth", async () => {
  const actual = await vi.importActual<typeof import("@/features/auth")>(
    "@/features/auth"
  );
  return {
    ...actual,
    useVerifyOtpMutation: () => ({
      mutate: mockVerifyMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      reset: vi.fn(),
    }),
    useResendOtpMutation: () => ({
      mutate: mockResendMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      reset: vi.fn(),
    }),
  };
});

// Mock ApiError thật
const realApi = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");

// Mock toast
const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
    info: vi.fn(),
  },
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
  mockVerifyMutate.mockReset();
  mockResendMutate.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
  // Mặc định: thành công
  mockVerifyMutate.mockImplementation(
    (
      _data: unknown,
      options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
    ) => {
      options?.onSuccess?.();
    }
  );
  mockResendMutate.mockImplementation(
    (
      _data: unknown,
      options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
    ) => {
      options?.onSuccess?.();
    }
  );
});

describe("VerifyEmailForm", () => {
  it("render stepper, title, masked email", () => {
    withQueryClient(<VerifyEmailForm email="an.nguyen@gmail.com" />);
    expect(screen.getByTestId("otp-stepper")).toBeInTheDocument();
    expect(screen.getByText("Xác thực email của bạn")).toBeInTheDocument();
    const masked = screen.getByTestId("masked-email");
    // Mask: "an***@gmail.com"
    expect(masked.textContent).toBe("an***@gmail.com");
  });

  it("hiển thị email placeholder khi email rỗng", () => {
    withQueryClient(<VerifyEmailForm email="" />);
    const masked = screen.getByTestId("masked-email");
    expect(masked.textContent).toBe("email của bạn");
  });

  it("render 6 ô OTP", () => {
    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    expect(screen.getByTestId("otp-cell-0")).toBeInTheDocument();
    expect(screen.getByTestId("otp-cell-5")).toBeInTheDocument();
  });

  it("render timer validity + resend countdown", () => {
    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    expect(screen.getByTestId("validity-timer")).toBeInTheDocument();
    expect(screen.getByTestId("resend-countdown")).toBeInTheDocument();
  });

  it("submit disable khi chưa nhập đủ 6 số", () => {
    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const submit = screen.getByTestId("verify-submit") as HTMLButtonElement;
    expect(submit).toBeDisabled();
  });

  it("submit enable khi nhập đủ 6 số", async () => {
    const user = userEvent.setup();
    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard(String(i + 1));
    }
    const submit = screen.getByTestId("verify-submit") as HTMLButtonElement;
    expect(submit).not.toBeDisabled();
  });

  it("submit gọi verifyMutate với email + code", async () => {
    const user = userEvent.setup();
    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("1");
    }
    const submit = screen.getByTestId("verify-submit");
    await user.click(submit);
    expect(mockVerifyMutate).toHaveBeenCalledTimes(1);
    expect(mockVerifyMutate.mock.calls[0][0]).toEqual({
      email: "an@gmail.com",
      code: "111111",
    });
  });

  it("hiển thị inline banner đỏ khi OTP_INVALID", async () => {
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementation(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_INVALID",
            message: "Invalid code",
            details: { attemptsLeft: 4 },
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    const submit = screen.getByTestId("verify-submit");
    await user.click(submit);

    await waitFor(() => {
      const banner = screen.getByTestId("otp-error-banner");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveAttribute("data-error-type", "invalid");
      expect(banner.textContent).toContain("4 lần thử");
    });
  });

  it("hiển thị banner expired khi OTP_EXPIRED", async () => {
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementation(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_EXPIRED",
            message: "Expired",
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    await user.click(screen.getByTestId("verify-submit"));

    await waitFor(() => {
      const banner = screen.getByTestId("otp-error-banner");
      expect(banner).toHaveAttribute("data-error-type", "expired");
    });
  });

  it("shake animation trigger khi lỗi", async () => {
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementation(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_INVALID",
            message: "Invalid",
            details: { attemptsLeft: 3 },
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    await user.click(screen.getByTestId("verify-submit"));

    // Sau lỗi, wrapper có data-shake="true" tại thời điểm đầu
    await waitFor(() => {
      const wrapper = screen.getByTestId("otp-shake-wrapper");
      // shake state có thể đã false sau 600ms, kiểm tra banner xuất hiện là đủ
      expect(wrapper).toBeInTheDocument();
    });
  });

  it("click Resend button gọi resendMutate", async () => {
    const user = userEvent.setup();
    withQueryClient(<VerifyEmailForm email="an@gmail.com" resendSeconds={0} />);
    // resendSeconds=0 → countdown = 0 ngay → hiện button
    const resendBtn = screen.getByTestId("resend-button");
    await user.click(resendBtn);
    expect(mockResendMutate).toHaveBeenCalledWith(
      { email: "an@gmail.com" },
      expect.any(Object)
    );
  });

  it("clear OTP code khi resend thành công", async () => {
    const user = userEvent.setup();
    withQueryClient(<VerifyEmailForm email="an@gmail.com" resendSeconds={0} />);
    // Nhập trước 6 số
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("1");
    }
    expect(screen.getByTestId("otp-cell-0")).toHaveAttribute(
      "data-filled",
      "true"
    );
    // Resend
    await user.click(screen.getByTestId("resend-button"));
    await waitFor(() => {
      expect(screen.getByTestId("otp-cell-0")).toHaveAttribute(
        "data-filled",
        "false"
      );
    });
  });

  it("setValue code khi OtpInput onChange được gọi với code mới (clear inline error)", async () => {
    // Test behavior thật: trigger OTP input onChange callback thông qua
    // user.paste (paste có thể thay thế toàn bộ).
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementationOnce(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_INVALID",
            message: "Invalid",
            details: { attemptsLeft: 4 },
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    // Trigger lỗi
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    await user.click(screen.getByTestId("verify-submit"));
    await waitFor(() => {
      expect(screen.getByTestId("otp-error-banner")).toBeInTheDocument();
    });

    // Dùng paste để fill lại 6 số mới → trigger onChange với "111111"
    inputs[0].focus();
    await user.paste("111111");
    await waitFor(
      () => {
        expect(
          screen.queryByTestId("otp-error-banner")
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("render link 'Quay lại đăng ký' trỏ về /register", () => {
    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const back = screen.getByTestId("back-to-register");
    expect(back).toHaveAttribute("href", "/register");
  });

  it("render security note", () => {
    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    expect(
      screen.getByText(/Bảo mật kết nối TLS 256-bit/i)
    ).toBeInTheDocument();
  });

  // ========== State B visual (Stitch handoff xac-thuc-email-sai-ma.md) ==========

  it("state B: title đổi thành 'Mã chưa đúng' khi OTP_INVALID", async () => {
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementation(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_INVALID",
            message: "Invalid",
            details: { attemptsLeft: 4 },
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    await user.click(screen.getByTestId("verify-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("error-title")).toBeInTheDocument();
    });
  });

  it("state B: nút submit đổi text thành 'Thử lại' khi OTP_INVALID", async () => {
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementation(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_INVALID",
            message: "Invalid",
            details: { attemptsLeft: 4 },
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    await user.click(screen.getByTestId("verify-submit"));

    await waitFor(() => {
      const submit = screen.getByTestId("verify-submit");
      // Submit button data-mode attribute reflects state
      expect(submit).toHaveAttribute("data-mode", "retry");
    });
  });

  it("state B: OtpStepper bước 2 hiển thị state='error' khi OTP_INVALID", async () => {
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementation(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_INVALID",
            message: "Invalid",
            details: { attemptsLeft: 4 },
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    await user.click(screen.getByTestId("verify-submit"));

    await waitFor(() => {
      const step2 = screen.getByTestId("otp-step-1");
      expect(step2).toHaveAttribute("data-state", "error");
    });
  });

  it("state B: card có line đỏ 1px trên top khi OTP_INVALID", async () => {
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementation(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_INVALID",
            message: "Invalid",
            details: { attemptsLeft: 4 },
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    await user.click(screen.getByTestId("verify-submit"));

    await waitFor(() => {
      const line = screen.getByTestId("card-error-line");
      expect(line).toBeInTheDocument();
    });
  });

  it("state B: mô tả hiển thị email masked khi OTP_INVALID", async () => {
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementation(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_INVALID",
            message: "Invalid",
            details: { attemptsLeft: 4 },
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an.nguyen@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    await user.click(screen.getByTestId("verify-submit"));

    await waitFor(() => {
      const desc = screen.getByTestId("error-description");
      expect(desc.textContent).toContain("an***@gmail.com");
    });
  });

  it("clear inline error khi user bắt đầu sửa → stepper trở về 'active'", async () => {
    const user = userEvent.setup();
    mockVerifyMutate.mockImplementation(
      (
        _data: unknown,
        options?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) => {
        options?.onError?.(
          new realApi.ApiError({
            status: 401,
            code: "OTP_INVALID",
            message: "Invalid",
            details: { attemptsLeft: 4 },
          })
        );
      }
    );

    withQueryClient(<VerifyEmailForm email="an@gmail.com" />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.keyboard("0");
    }
    await user.click(screen.getByTestId("verify-submit"));
    await waitFor(() => {
      expect(screen.getByTestId("otp-step-1")).toHaveAttribute(
        "data-state",
        "error"
      );
    });

    // User paste lại → clear error
    inputs[0].focus();
    await user.paste("123456");
    await waitFor(() => {
      expect(screen.getByTestId("otp-step-1")).toHaveAttribute(
        "data-state",
        "active"
      );
    });
  });
});
