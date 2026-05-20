import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscountCodeDetail } from "./discount-code-detail";
import * as api from "@/lib/discount-codes/api";

vi.mock("@/lib/discount-codes/api");

describe("DiscountCodeDetail", () => {
  beforeEach(() => {
    vi.mocked(api.getDiscountCode).mockResolvedValue({
      id: "code-1",
      code: "BLACKFRIDAY",
      discountType: "fixed",
      discountValue: 20,
      expiresAt: "2026-11-30",
      usageLimit: 200,
      redemptionCount: 40,
      campaign: "Black Friday",
      status: "active",
    });
  });

  it("renders a specific discount code and redeems it", async () => {
    vi.mocked(api.redeemDiscountCode).mockResolvedValue({
      code: {
        id: "code-1",
        code: "BLACKFRIDAY",
        discountType: "fixed",
        discountValue: 20,
        expiresAt: "2026-11-30",
        usageLimit: 200,
        redemptionCount: 41,
        campaign: "Black Friday",
        status: "active",
      },
    });
    const user = userEvent.setup();

    render(<DiscountCodeDetail id="code-1" />);

    expect(
      await screen.findByRole("heading", { name: "BLACKFRIDAY" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /redeem code/i }));

    expect(await screen.findByText("41 / 200")).toBeInTheDocument();
  });
});
