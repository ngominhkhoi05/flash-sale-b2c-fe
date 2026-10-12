import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { NotFoundPage } from "./NotFoundPage";

const viMessages = {
  error: {
    notFound: {
      brandTag: "VIBE MART",
      idBadge: "Lỗi 404",
      title: "Không tìm thấy trang",
      description: "Trang bạn tìm có thể đã bị xóa hoặc đổi địa chỉ.",
      primaryAction: "Về trang chủ",
      secondaryAction: "Quay lại",
      hintPrefix: "Gợi ý:",
      hintText: "Kiểm tra lại đường dẫn URL hoặc quay lại trang trước",
      supportPrompt: "Cần hỗ trợ ngay?",
      supportLink: "Hỗ trợ khách hàng",
      searchLink: "Tìm kiếm sản phẩm",
    },
  },
};

const enMessages = {
  error: {
    notFound: {
      brandTag: "VIBE MART",
      idBadge: "Error 404",
      title: "Page not found",
      description:
        "The page you're looking for may have been removed or moved.",
      primaryAction: "Back to home",
      secondaryAction: "Go back",
      hintPrefix: "Tip:",
      hintText: "Check the URL or return to the previous page",
      supportPrompt: "Need help?",
      supportLink: "Customer support",
      searchLink: "Search products",
    },
  },
};

function renderWithIntl(
  ui: React.ReactNode,
  options: { locale?: "vi" | "en"; messages?: typeof viMessages } = {}
) {
  const { locale = "vi", messages = viMessages } = options;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {ui}
    </NextIntlClientProvider>
  );
}

describe("NotFoundPage – Stitch pixel-perfect", () => {
  it("renders the H1 title from i18n (vi)", () => {
    renderWithIntl(<NotFoundPage />);
    expect(
      screen.getByRole("heading", { name: /Không tìm thấy trang/i, level: 1 })
    ).toBeInTheDocument();
  });

  it("renders the description paragraph from i18n", () => {
    renderWithIntl(<NotFoundPage />);
    expect(
      screen.getByText(
        /Trang bạn tìm có thể đã bị xóa hoặc đổi địa chỉ\./i
      )
    ).toBeInTheDocument();
  });

  it("renders the brand pill (Vibe Mart logo + Lỗi 404)", () => {
    renderWithIntl(<NotFoundPage />);
    // Brand pill now shows the default Vibe Mart logo lockup image plus the
    // "Lỗi 404" badge text. Logo is rendered via next/image, so we assert
    // the img alt and the text badge.
    const logo = screen.getByRole("img", { name: /Vibe Mart/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute(
      "src",
      expect.stringContaining("vibe-mart-logo-lockup-light.png")
    );
    expect(screen.getByText("Lỗi 404")).toBeInTheDocument();
  });

  it("renders the SVG 404 illustration", () => {
    renderWithIntl(<NotFoundPage />);
    expect(screen.getByTestId("error-404-illustration")).toBeInTheDocument();
  });

  it("primary action is a link to / (CLAUDE.md §2 URL)", () => {
    renderWithIntl(<NotFoundPage />);
    const primary = screen.getByRole("link", { name: /Về trang chủ/i });
    expect(primary).toHaveAttribute("href", "/");
  });

  it("secondary action is a button with text 'Quay lại'", () => {
    renderWithIntl(<NotFoundPage />);
    const secondary = screen.getByRole("button", { name: /Quay lại/i });
    expect(secondary).toHaveAttribute("type", "button");
  });

  it("renders the hint text (vi)", () => {
    renderWithIntl(<NotFoundPage />);
    expect(
      screen.getByText(
        /Kiểm tra lại đường dẫn URL hoặc quay lại trang trước/i
      )
    ).toBeInTheDocument();
  });

  it("renders the support link 'Hỗ trợ khách hàng'", () => {
    renderWithIntl(<NotFoundPage />);
    expect(screen.getByText("Hỗ trợ khách hàng")).toBeInTheDocument();
  });

  it("renders the search link 'Tìm kiếm sản phẩm'", () => {
    renderWithIntl(<NotFoundPage />);
    expect(screen.getByText("Tìm kiếm sản phẩm")).toBeInTheDocument();
  });

  it("renders the 'Cần hỗ trợ ngay?' prompt", () => {
    renderWithIntl(<NotFoundPage />);
    expect(screen.getByText(/Cần hỗ trợ ngay\?/)).toBeInTheDocument();
  });
});

describe("NotFoundPage – i18n English", () => {
  it("renders the H1 title 'Page not found'", () => {
    renderWithIntl(<NotFoundPage />, { locale: "en", messages: enMessages });
    expect(
      screen.getByRole("heading", { name: /Page not found/i, level: 1 })
    ).toBeInTheDocument();
  });

  it("primary action text is 'Back to home'", () => {
    renderWithIntl(<NotFoundPage />, { locale: "en", messages: enMessages });
    expect(
      screen.getByRole("link", { name: /Back to home/i })
    ).toHaveAttribute("href", "/");
  });

  it("secondary action text is 'Go back'", () => {
    renderWithIntl(<NotFoundPage />, { locale: "en", messages: enMessages });
    expect(
      screen.getByRole("button", { name: /Go back/i })
    ).toBeInTheDocument();
  });

  it("renders 'Customer support' and 'Search products' quick-links", () => {
    renderWithIntl(<NotFoundPage />, { locale: "en", messages: enMessages });
    expect(screen.getByText("Customer support")).toBeInTheDocument();
    expect(screen.getByText("Search products")).toBeInTheDocument();
  });
});
