/**
 * Tests for CheckoutFooter.
 *
 * Covers:
 *  - renders copyright + PCI-DSS badge
 *  - renders 4 legal links (terms, privacy, payment guide, help center)
 *  - links point to correct hrefs
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutFooter } from "./CheckoutFooter";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      copyright: "© 2026 Vibe Mart. All rights reserved.",
      pciBadge: "PCI-DSS COMPLIANT",
      terms: "Terms of service",
      privacy: "Privacy policy",
      paymentGuide: "Payment guide",
      helpCenter: "Help center",
    };
    return map[key] ?? key;
  },
}));

describe("CheckoutFooter", () => {
  it("renders copyright và PCI-DSS badge", () => {
    render(<CheckoutFooter />);
    expect(
      screen.getByText(/© 2026 Vibe Mart\. All rights reserved\./),
    ).toBeInTheDocument();
    expect(screen.getByText("PCI-DSS COMPLIANT")).toBeInTheDocument();
  });

  it("renders 4 link pháp lý với href đúng", () => {
    render(<CheckoutFooter />);
    const links = {
      terms: screen.getByRole("link", { name: /Terms of service/ }),
      privacy: screen.getByRole("link", { name: /Privacy policy/ }),
      paymentGuide: screen.getByRole("link", { name: /Payment guide/ }),
      helpCenter: screen.getByRole("link", { name: /Help center/ }),
    };
    expect(links.terms).toHaveAttribute("href", "/terms");
    expect(links.privacy).toHaveAttribute("href", "/privacy");
    expect(links.paymentGuide).toHaveAttribute("href", "/payment-guide");
    expect(links.helpCenter).toHaveAttribute("href", "/support");
  });

  it("renders <footer> semantic element with testid", () => {
    render(<CheckoutFooter />);
    const footer = screen.getByTestId("checkout-footer");
    expect(footer.tagName).toBe("FOOTER");
  });
});
