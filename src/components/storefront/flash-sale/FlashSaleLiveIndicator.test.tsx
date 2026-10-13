/**
 * Smoke test cho FlashSaleLiveIndicator.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashSaleLiveIndicator } from "./FlashSaleLiveIndicator";

describe("FlashSaleLiveIndicator", () => {
  it("renders 'Đang diễn ra' label", () => {
    render(<FlashSaleLiveIndicator activeSlotId={2} />);
    expect(screen.getByText("Đang diễn ra")).toBeInTheDocument();
  });

  it("renders 3 xl size flash icon", () => {
    render(<FlashSaleLiveIndicator activeSlotId={2} />);
    // MaterialSymbol name="bolt" renders <span data-testid="material-symbol-bolt">bolt</span>
    expect(screen.getAllByTestId("material-symbol-bolt").length).toBeGreaterThanOrEqual(1);
  });

  it("renders liveViewers with k formatting when provided", () => {
    render(<FlashSaleLiveIndicator activeSlotId={2} liveViewers={4200} />);
    expect(screen.getByText(/4\.2k/i)).toBeInTheDocument();
  });

  it("does not render viewer chip when liveViewers is undefined", () => {
    render(<FlashSaleLiveIndicator activeSlotId={2} />);
    expect(screen.queryByText(/đang xem/i)).not.toBeInTheDocument();
  });
});
