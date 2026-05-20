import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscountDashboard } from "./discount-dashboard";
import * as api from "@/lib/discount-codes/api";

vi.mock("@/lib/discount-codes/api");

const code = {
  id: "code-1",
  code: "SUMMER20",
  discountType: "percentage" as const,
  discountValue: 20,
  expiresAt: "2026-08-01",
  usageLimit: 10,
  redemptionCount: 3,
  campaign: "Summer",
  status: "active" as const,
};

const summary = {
  totalCodes: 1,
  totalRedemptions: 3,
  activeCodes: 1,
  expiredCodes: 0,
  usageLimitReachedCodes: 0,
  campaigns: [
    {
      campaign: "Summer",
      codeCount: 1,
      redemptionCount: 3,
    },
  ],
};

describe("DiscountDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getDiscountCodes).mockResolvedValue([code]);
    vi.mocked(api.getUsageSummary).mockResolvedValue(summary);
  });

  it("renders usage summary and discount code rows", async () => {
    render(<DiscountDashboard />);

    expect(await screen.findByText("SUMMER20")).toBeInTheDocument();
    expect(screen.getAllByText("Summer")).toHaveLength(2);
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
    expect(screen.getByText("3 total redemptions")).toBeInTheDocument();
  });

  it("redeems a code from the list without reloading the page", async () => {
    vi.mocked(api.redeemDiscountCode).mockResolvedValue({
      code: { ...code, redemptionCount: 4 },
      summary: { ...summary, totalRedemptions: 4 },
    });
    const user = userEvent.setup();

    render(<DiscountDashboard />);

    const row = await screen.findByRole("row", { name: /SUMMER20/i });
    await user.click(within(row).getByRole("button", { name: /redeem/i }));

    expect(api.redeemDiscountCode).toHaveBeenCalledWith("code-1");
    expect(await screen.findByText("4 / 10")).toBeInTheDocument();
    expect(screen.getByText("4 total redemptions")).toBeInTheDocument();
  });

  it("shows redeem failures from the backend", async () => {
    vi.mocked(api.redeemDiscountCode).mockRejectedValue(
      new Error("Code has reached its usage limit"),
    );
    const user = userEvent.setup();

    render(<DiscountDashboard />);

    const row = await screen.findByRole("row", { name: /SUMMER20/i });
    await user.click(within(row).getByRole("button", { name: /redeem/i }));

    expect(
      await screen.findByText("Code has reached its usage limit"),
    ).toBeInTheDocument();
  });
});
