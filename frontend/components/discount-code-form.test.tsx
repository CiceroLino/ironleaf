import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscountCodeForm } from "./discount-code-form";
import * as api from "@/lib/discount-codes/api";

vi.mock("@/lib/discount-codes/api");

describe("DiscountCodeForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("submits the expected create payload", async () => {
    vi.mocked(api.getCampaigns).mockResolvedValue([
      { id: "campaign-1", name: "Welcome" },
    ]);
    vi.mocked(api.createDiscountCode).mockResolvedValue({
      id: "code-1",
      code: "WELCOME20",
      campaignId: "campaign-1",
      campaign: { id: "campaign-1", name: "Welcome" },
      discountType: "FIXED",
      discountValue: 20,
      currency: "USD",
      expiresAt: "2026-12-31",
      usageLimit: 100,
      redemptionCount: 0,
      status: "active",
    });
    const user = userEvent.setup();

    render(<DiscountCodeForm />);

    await user.type(screen.getByLabelText(/code/i), "WELCOME20");
    await screen.findByRole("option", { name: "Welcome" });
    await user.selectOptions(screen.getByLabelText(/campaign/i), "campaign-1");
    await user.selectOptions(screen.getByLabelText(/discount type/i), "FIXED");
    await user.clear(screen.getByLabelText(/discount value/i));
    await user.type(screen.getByLabelText(/discount value/i), "20");
    await user.type(screen.getByLabelText(/expiry date/i), "2026-12-31");
    await user.clear(screen.getByLabelText(/usage limit/i));
    await user.type(screen.getByLabelText(/usage limit/i), "100");
    await user.click(screen.getByRole("button", { name: /create code/i }));

    expect(api.createDiscountCode).toHaveBeenCalledWith({
      code: "WELCOME20",
      campaignId: "campaign-1",
      discountType: "FIXED",
      discountValue: 20,
      currency: "USD",
      expiresAt: "2026-12-31",
      usageLimit: 100,
    });
    expect(await screen.findByText(/created WELCOME20/i)).toBeInTheDocument();
  });

  it("creates a new campaign from the campaign select modal", async () => {
    vi.mocked(api.getCampaigns).mockResolvedValue([]);
    vi.mocked(api.createCampaign).mockResolvedValue({
      id: "campaign-2",
      name: "Black Friday",
    });
    vi.mocked(api.createDiscountCode).mockResolvedValue({
      id: "code-1",
      code: "BF20",
      campaignId: "campaign-2",
      campaign: { id: "campaign-2", name: "Black Friday" },
      discountType: "PERCENT",
      discountValue: 20,
      expiresAt: "2026-12-31",
      usageLimit: 50,
      redemptionCount: 0,
      status: "active",
    });
    const user = userEvent.setup();

    render(<DiscountCodeForm />);

    await screen.findByText(/no campaigns yet/i);
    await user.click(screen.getByRole("button", { name: /add campaign/i }));
    await user.type(screen.getByLabelText(/campaign name/i), "Black Friday");
    await user.click(screen.getByRole("button", { name: /create campaign/i }));

    expect(api.createCampaign).toHaveBeenCalledWith({ name: "Black Friday" });
    expect(await screen.findByRole("option", { name: "Black Friday" }))
      .toBeInTheDocument();
    expect(screen.getByLabelText(/campaign/i)).toHaveValue("campaign-2");

    await user.type(screen.getByLabelText(/code/i), "BF20");
    await user.clear(screen.getByLabelText(/discount value/i));
    await user.type(screen.getByLabelText(/discount value/i), "20");
    await user.type(screen.getByLabelText(/expiry date/i), "2026-12-31");
    await user.clear(screen.getByLabelText(/usage limit/i));
    await user.type(screen.getByLabelText(/usage limit/i), "50");
    await user.click(screen.getByRole("button", { name: /create code/i }));

    expect(api.createDiscountCode).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "BF20",
        campaignId: "campaign-2",
      }),
    );
  });

  it("keeps discount form data when campaign creation fails", async () => {
    vi.mocked(api.getCampaigns).mockResolvedValue([
      { id: "campaign-1", name: "Welcome" },
    ]);
    vi.mocked(api.createCampaign).mockRejectedValue(
      new Error("Campaign name already exists"),
    );
    const user = userEvent.setup();

    render(<DiscountCodeForm />);

    await user.type(screen.getByLabelText(/code/i), "SAVE15");
    await screen.findByRole("option", { name: "Welcome" });
    await user.selectOptions(
      screen.getByLabelText(/campaign/i),
      "__new_campaign__",
    );
    await user.type(screen.getByLabelText(/campaign name/i), "Welcome");
    await user.click(screen.getByRole("button", { name: /create campaign/i }));

    expect(await screen.findByText(/campaign name already exists/i))
      .toBeInTheDocument();
    expect(screen.getByLabelText(/code/i)).toHaveValue("SAVE15");
  });
});
