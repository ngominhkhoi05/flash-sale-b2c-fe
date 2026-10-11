import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MaterialSymbol } from "./material-symbol";

describe("MaterialSymbol", () => {
  it("renders the icon name as text content", () => {
    render(<MaterialSymbol name="search" />);
    const el = screen.getByTestId("material-symbol-search");
    expect(el.textContent).toBe("search");
  });

  it("always carries the material-symbols-outlined base class", () => {
    render(<MaterialSymbol name="search" />);
    const el = screen.getByTestId("material-symbol-search");
    expect(el.className).toContain("material-symbols-outlined");
  });

  it("applies the requested Tailwind text-size class", () => {
    render(<MaterialSymbol name="bolt" size="2xl" />);
    const el = screen.getByTestId("material-symbol-bolt");
    expect(el.className).toContain("text-2xl");
  });

  it("supports arbitrary Tailwind text-size values like [14px]", () => {
    render(<MaterialSymbol name="chevron_right" size="[14px]" />);
    const el = screen.getByTestId("material-symbol-chevron_right");
    expect(el.className).toContain("text-[14px]");
  });

  it("when fill is true, sets FILL=1 via inline fontVariationSettings", () => {
    render(<MaterialSymbol name="verified" fill />);
    const el = screen.getByTestId("material-symbol-verified");
    expect(el.getAttribute("style")).toContain("FILL");
  });

  it("when fill is false (default), no FILL inline style is added", () => {
    render(<MaterialSymbol name="search" />);
    const el = screen.getByTestId("material-symbol-search");
    const style = el.getAttribute("style") ?? "";
    expect(style).not.toContain("FILL");
  });

  it("emits inline font-size matching the requested size to override Material Symbols base (24px)", () => {
    // The Material Symbols CSS sets font-size: 24px with the same specificity
    // as a Tailwind utility class. To win reliably, MaterialSymbol mirrors the
    // size as an inline style attribute.
    render(<MaterialSymbol name="chevron_right" size="[14px]" />);
    const el = screen.getByTestId("material-symbol-chevron_right");
    expect(el.getAttribute("style")).toContain("font-size: 14px");
  });

  it("uses default base size (16px) inline when no size prop is given", () => {
    render(<MaterialSymbol name="search" />);
    const el = screen.getByTestId("material-symbol-search");
    expect(el.getAttribute("style")).toContain("font-size: 16px");
  });

  it("merges custom className via cn()", () => {
    render(<MaterialSymbol name="star" className="text-amber-500" />);
    const el = screen.getByTestId("material-symbol-star");
    expect(el.className).toContain("text-amber-500");
    expect(el.className).toContain("material-symbols-outlined");
  });

  it("is decorative (aria-hidden) when no label is provided", () => {
    render(<MaterialSymbol name="search" />);
    expect(screen.getByTestId("material-symbol-search")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("sets aria-label when label prop is provided (no aria-hidden)", () => {
    render(<MaterialSymbol name="search" label="Tìm kiếm" />);
    const el = screen.getByTestId("material-symbol-search");
    expect(el).toHaveAttribute("aria-label", "Tìm kiếm");
    expect(el).not.toHaveAttribute("aria-hidden");
  });

  it("accepts the footer-specific icon names: verified_user, mail, phone_iphone, android", () => {
    // These are added to the allowlist in 2026-10-11 for StorefrontFooter.
    // Rendering must succeed for each (type check + data-testid + content).
    const names = ["verified_user", "mail", "phone_iphone", "android"] as const;
    for (const name of names) {
      const { unmount } = render(<MaterialSymbol name={name} />);
      const el = screen.getByTestId(`material-symbol-${name}`);
      expect(el.textContent).toBe(name);
      expect(el.className).toContain("material-symbols-outlined");
      unmount();
    }
  });
});
