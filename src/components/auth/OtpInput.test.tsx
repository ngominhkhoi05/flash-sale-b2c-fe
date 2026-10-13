import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OtpInput } from "./OtpInput";

describe("OtpInput", () => {
  it("renders 6 ô input mặc định", () => {
    render(<OtpInput value="" onChange={() => {}} />);
    expect(screen.getByTestId("otp-cell-0")).toBeInTheDocument();
    expect(screen.getByTestId("otp-cell-5")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox", { hidden: false })).toHaveLength(6);
    // Hoặc dùng aria-label
    expect(
      screen.getByLabelText("OTP digit 1")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("OTP digit 6")
    ).toBeInTheDocument();
  });

  it("hỗ trợ length tuỳ chỉnh", () => {
    render(<OtpInput value="" onChange={() => {}} length={4} />);
    expect(screen.getByTestId("otp-cell-0")).toBeInTheDocument();
    expect(screen.getByTestId("otp-cell-3")).toBeInTheDocument();
    expect(screen.queryByTestId("otp-cell-4")).not.toBeInTheDocument();
  });

  it("hiển thị giá trị controlled (value) theo từng ô", () => {
    render(<OtpInput value="123" onChange={() => {}} />);
    const cell0 = screen.getByTestId("otp-cell-0");
    const cell3 = screen.getByTestId("otp-cell-3");
    expect(cell0).toHaveAttribute("data-filled", "true");
    expect(cell3).toHaveAttribute("data-filled", "false");
  });

  it("gọi onChange khi nhập 1 số vào ô đầu", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} />);

    const firstInput = screen.getByLabelText("OTP digit 1");
    await user.type(firstInput, "1");

    expect(onChange).toHaveBeenCalled();
    // Lần gọi cuối cùng phải là "1"
    const lastCallArg = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCallArg).toBe("1");
  });

  it("auto-advance sang ô tiếp theo sau khi nhập", async () => {
    const user = userEvent.setup();
    render(<OtpInput value="1" onChange={() => {}} />);

    // Focus ô thứ 2 thủ công
    const secondInput = screen.getByLabelText("OTP digit 2");
    await user.click(secondInput);
    await user.keyboard("2");

    // Sau khi gõ "2", focus phải ở ô 3
    const thirdInput = screen.getByLabelText("OTP digit 3");
    expect(document.activeElement).toBe(thirdInput);
  });

  it("chỉ chấp nhận chữ số (filter ký tự khác)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} />);

    const firstInput = screen.getByLabelText("OTP digit 1");
    await user.click(firstInput);
    await user.keyboard("abc123xyz");

    // Phải lọc lấy "1" (chữ số cuối cùng), không phải "abc"
    const allValues = onChange.mock.calls.map((c) => c[0]);
    // Tất cả các giá trị chỉ được chứa chữ số
    for (const v of allValues) {
      expect(v).toMatch(/^\d*$/);
    }
    // Phải có ít nhất 1 lần gọi với "1"
    expect(allValues).toContain("1");
  });

  it("Backspace trên ô rỗng → focus + xoá ô trước", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="12" onChange={onChange} />);

    // Focus ô 3 (rỗng) → Backspace → phải xoá ô 2 và focus về ô 2
    const thirdInput = screen.getByLabelText("OTP digit 3");
    await user.click(thirdInput);
    await user.keyboard("{Backspace}");

    // onChange phải được gọi với "1" (xoá "2")
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toBe("1");
    // Focus về ô 2
    const secondInput = screen.getByLabelText("OTP digit 2");
    expect(document.activeElement).toBe(secondInput);
  });

  it("Backspace trên ô có giá trị → chỉ xoá ô đó", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="12" onChange={onChange} />);

    const secondInput = screen.getByLabelText("OTP digit 2");
    await user.click(secondInput);
    await user.keyboard("{Backspace}");

    // Phải xoá "2" → còn "1"
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toBe("1");
  });

  it("paste 6 chữ số → fill hết + focus ô cuối", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} />);

    const firstInput = screen.getByLabelText("OTP digit 1");
    firstInput.focus();
    await user.paste("123456");

    expect(onChange).toHaveBeenCalledWith("123456");
    // Focus ô cuối
    const lastInput = screen.getByLabelText("OTP digit 6");
    expect(document.activeElement).toBe(lastInput);
  });

  it("paste 6+ chữ số chỉ lấy 6 chữ số đầu", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} />);

    const firstInput = screen.getByLabelText("OTP digit 1");
    firstInput.focus();
    await user.paste("1234567890");

    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("paste ký tự không phải số → bỏ qua", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} />);

    const firstInput = screen.getByLabelText("OTP digit 1");
    firstInput.focus();
    await user.paste("abcdef");

    // onChange KHÔNG được gọi với giá trị (paste handler return sớm vì không có chữ số)
    // Tuy nhiên user.paste có thể trigger onChange nếu có bất kỳ chữ số nào
    const calls = onChange.mock.calls.map((c) => c[0]);
    for (const v of calls) {
      expect(v).toMatch(/^\d*$/);
      expect(v).toBe(""); // chỉ có thể là rỗng vì "abcdef" không có chữ số
    }
  });

  it("hiển thị error state (border đỏ) khi hasError=true", () => {
    render(<OtpInput value="123" onChange={() => {}} hasError />);
    const cell0 = screen.getByTestId("otp-cell-0");
    expect(cell0.className).toMatch(/border-danger/);
  });

  it("không có lỗi: ô filled có border-outline (2px)", () => {
    render(<OtpInput value="1" onChange={() => {}} />);
    const cell0 = screen.getByTestId("otp-cell-0");
    expect(cell0.className).toMatch(/border-2/);
  });

  it("disabled: không nhận input", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} disabled />);

    const firstInput = screen.getByLabelText("OTP digit 1");
    expect(firstInput).toBeDisabled();

    // Cố gõ vẫn không onChange
    await user.click(firstInput);
    await user.keyboard("1");
    expect(onChange).not.toHaveBeenCalled();
  });

  // ========== disabledState="locked" – Stich state tooMany ==========

  it("locked: 6 ô input bị thay bằng div read-only hiển thị '—'", () => {
    render(<OtpInput value="" onChange={() => {}} disabledState="locked" />);
    // Không còn input thật (querySelector hidden vì <input> bị ẩn)
    expect(screen.queryByLabelText("OTP digit 1")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("OTP digit 6")).not.toBeInTheDocument();
    // 6 ô vẫn render với testid
    expect(screen.getByTestId("otp-cell-0")).toBeInTheDocument();
    expect(screen.getByTestId("otp-cell-5")).toBeInTheDocument();
    // 6 ô có data-state="locked"
    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`otp-cell-${i}`)).toHaveAttribute(
        "data-state",
        "locked"
      );
    }
  });

  it("locked: mỗi ô hiển thị text '—' khi không có value", () => {
    render(<OtpInput value="" onChange={() => {}} disabledState="locked" />);
    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`otp-cell-${i}`)).toHaveTextContent("—");
    }
  });

  it("locked: container có data-testid='otp-input-locked' để phân biệt", () => {
    render(<OtpInput value="" onChange={() => {}} disabledState="locked" />);
    expect(screen.getByTestId("otp-input-locked")).toBeInTheDocument();
  });

  it("locked: container có aria-disabled='true'", () => {
    render(<OtpInput value="" onChange={() => {}} disabledState="locked" />);
    expect(screen.getByTestId("otp-input-locked")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });
});
