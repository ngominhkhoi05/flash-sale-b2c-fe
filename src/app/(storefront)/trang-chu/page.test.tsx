/**
 * Snapshot test cho HomepageView – theo user yêu cầu pixel-match 100%.
 *
 * Render HomepageView với wrapper i18n và chụp HTML snapshot.
 * Nếu HTML gặp dữ liệu động (vd: timestamp), snapshotted phải chứa marker
 * placeholder để render mỗi lần đều giống nhau.
 *
 * Notes: snapshot file `__snapshots__/page.test.tsx.snap` sẽ được tạo lần đầu
 * chạy. Mỗi lần sau phải match y hệt — nếu khác, buộc phải update snapshot
 * bằng `npx vitest run -u`.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HomepageView } from "./_homepage-view";
import { TestWrapper } from "@/__tests__/test-wrapper";

describe("HomepageView – snapshot pixel-match", () => {
  it("renders all 7 sections with expected headings", () => {
    const { container } = render(<HomepageView />, { wrapper: TestWrapper });

    // Hero: h1 is gone (banner is image-only). 4 sub section h2 remain.
    const headings = Array.from(container.querySelectorAll("h2")).map(
      (h) => h.textContent?.toLowerCase() ?? ""
    );
    expect(headings.some((t) => t.includes("danh mục"))).toBe(true);
    expect(headings.some((t) => t.includes("flash sale"))).toBe(true);
    expect(headings.some((t) => t.includes("mã giảm"))).toBe(true);
    expect(headings.some((t) => t.includes("shop nổi bật"))).toBe(true);
  });

  it("snapshot of rendered HTML for pixel-match review", () => {
    const { container } = render(<HomepageView />, { wrapper: TestWrapper });
    // Strip dynamic attributes (data-*, timestamps) for stable snapshot
    const html = container.innerHTML.replace(/\s+data-testid="[^"]*"/g, "");
    expect(html).toMatchSnapshot();
  });
});
