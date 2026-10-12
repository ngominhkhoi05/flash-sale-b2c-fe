import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { MaintenancePage } from "./MaintenancePage";

const viMessages = {
  error: {
    maintenance: {
      codeBadge: "Mã tính năng: review:create",
      title: "Tính năng đang được nâng cấp",
      descriptionPrefix:
        "Chúng tôi đang hoàn thiện và tối ưu trải nghiệm ",
      descriptionHighlight: "Đánh giá sản phẩm",
      descriptionSuffix:
        " để phục vụ bạn trọn vẹn hơn. Xin vui lòng quay lại sau ít phút.",
      progressTitle: "Tiến trình nâng cấp tự động",
      progressBody:
        "Dự kiến hoàn tất trong chốc lát. Đơn hàng, giỏ hàng và các hoạt động mua sắm khác của bạn vẫn diễn ra bình thường và được đảm bảo an toàn tuyệt đối.",
      primaryAction: "Về trang chủ",
      secondaryAction: "Hỗ trợ trực tuyến 24/7",
      explorePrompt: "Trong lúc chờ đợi, bạn có thể khám phá thêm:",
      exploreFlashSale: "Flash Sale hôm nay",
      exploreBestSellers: "Sản phẩm bán chạy",
      exploreOrders: "Kiểm tra đơn hàng",
    },
  },
};

const enMessages = {
  error: {
    maintenance: {
      codeBadge: "Feature code: review:create",
      title: "Feature being upgraded",
      descriptionPrefix: "We're polishing and improving the ",
      descriptionHighlight: "Product reviews",
      descriptionSuffix:
        " experience to serve you better. Please come back in a few minutes.",
      progressTitle: "Auto-upgrade in progress",
      progressBody:
        "Expected to complete shortly. Your orders, cart, and other shopping activities continue normally and are guaranteed absolutely safe.",
      primaryAction: "Back to home",
      secondaryAction: "24/7 Live support",
      explorePrompt: "While you wait, you can explore:",
      exploreFlashSale: "Today's Flash Sale",
      exploreBestSellers: "Best sellers",
      exploreOrders: "Check orders",
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

describe("MaintenancePage – Stitch pixel-perfect (vi)", () => {
  it("renders the H1 title from i18n", () => {
    renderWithIntl(<MaintenancePage />);
    expect(
      screen.getByRole("heading", {
        name: /Tính năng đang được nâng cấp/i,
        level: 1,
      })
    ).toBeInTheDocument();
  });

  it("renders the description paragraph with highlighted 'Đánh giá sản phẩm'", () => {
    renderWithIntl(<MaintenancePage />);
    // Highlight is rendered as <span class="font-label-lg text-on-surface">.
    const highlight = screen.getByText("Đánh giá sản phẩm");
    expect(highlight).toBeInTheDocument();
    // The prefix is also visible (substring match in the same <p>).
    expect(
      screen.getByText(/Chúng tôi đang hoàn thiện và tối ưu trải nghiệm/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /để phục vụ bạn trọn vẹn hơn\. Xin vui lòng quay lại sau ít phút\./i
      )
    ).toBeInTheDocument();
  });

  it("renders the feature code sub-pill", () => {
    renderWithIntl(<MaintenancePage />);
    expect(
      screen.getByText(/Mã tính năng: review:create/i)
    ).toBeInTheDocument();
  });

  it("renders the auto-progress info card title", () => {
    renderWithIntl(<MaintenancePage />);
    expect(
      screen.getByText("Tiến trình nâng cấp tự động")
    ).toBeInTheDocument();
  });

  it("renders the auto-progress info card body", () => {
    renderWithIntl(<MaintenancePage />);
    expect(
      screen.getByText(
        /Dự kiến hoàn tất trong chốc lát\. Đơn hàng, giỏ hàng và các hoạt động mua sắm khác/i
      )
    ).toBeInTheDocument();
  });

  it("renders the centerpiece illustration (SVG)", () => {
    renderWithIntl(<MaintenancePage />);
    expect(
      screen.getByTestId("maintenance-illustration")
    ).toBeInTheDocument();
  });

  it("renders the 'in the meantime' explore prompt", () => {
    renderWithIntl(<MaintenancePage />);
    expect(
      screen.getByText(/Trong lúc chờ đợi, bạn có thể khám phá thêm:/i)
    ).toBeInTheDocument();
  });

  it("renders the 3 quick-link pills", () => {
    renderWithIntl(<MaintenancePage />);
    expect(screen.getByText("Flash Sale hôm nay")).toBeInTheDocument();
    expect(screen.getByText("Sản phẩm bán chạy")).toBeInTheDocument();
    expect(screen.getByText("Kiểm tra đơn hàng")).toBeInTheDocument();
  });

  it("primary action links to / (CLAUDE.md §2 URL)", () => {
    renderWithIntl(<MaintenancePage />);
    const primary = screen.getByRole("link", { name: /Về trang chủ/i });
    expect(primary).toHaveAttribute("href", "/");
  });

  it("secondary action links to /support", () => {
    renderWithIntl(<MaintenancePage />);
    const secondary = screen.getByRole("link", {
      name: /Hỗ trợ trực tuyến 24\/7/i,
    });
    expect(secondary).toHaveAttribute("href", "/support");
  });

  it("quick-link 'Flash Sale hôm nay' links to /flash-sale", () => {
    renderWithIntl(<MaintenancePage />);
    const link = screen.getByRole("link", { name: /Flash Sale hôm nay/i });
    expect(link).toHaveAttribute("href", "/flash-sale");
  });

  it("quick-link 'Sản phẩm bán chạy' links to /categories", () => {
    renderWithIntl(<MaintenancePage />);
    const link = screen.getByRole("link", { name: /Sản phẩm bán chạy/i });
    expect(link).toHaveAttribute("href", "/categories");
  });

  it("quick-link 'Kiểm tra đơn hàng' links to /cart", () => {
    renderWithIntl(<MaintenancePage />);
    const link = screen.getByRole("link", { name: /Kiểm tra đơn hàng/i });
    expect(link).toHaveAttribute("href", "/cart");
  });
});

describe("MaintenancePage – i18n English", () => {
  it("renders the English H1 'Feature being upgraded'", () => {
    renderWithIntl(<MaintenancePage />, { locale: "en", messages: enMessages });
    expect(
      screen.getByRole("heading", {
        name: /Feature being upgraded/i,
        level: 1,
      })
    ).toBeInTheDocument();
  });

  it("primary action text is 'Back to home' linking to /", () => {
    renderWithIntl(<MaintenancePage />, { locale: "en", messages: enMessages });
    expect(
      screen.getByRole("link", { name: /Back to home/i })
    ).toHaveAttribute("href", "/");
  });
});
