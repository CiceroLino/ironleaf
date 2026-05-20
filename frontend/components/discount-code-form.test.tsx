import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DiscountCodeForm } from "./discount-code-form";
import * as api from "@/lib/discount-codes/api";

vi.mock("@/lib/discount-codes/api");

describe("DiscountCodeForm", () => {
  it("submits the expected create payload", async () => {
    vi.mocked(api.createDiscountCode).mockResolvedValue({
      id: "code-1",
      code: "WELCOME20",
      discountType: "fixed",
      discountValue: 20,
      expiresAt: "2026-12-31",
      usageLimit: 100,
      redemptionCount: 0,
      campaign: "Welcome",
      status: "active",
    });
    const user = userEvent.setup();

    render(<DiscountCodeForm />);

    await user.type(screen.getByLabelText(/code/i), "WELCOME20");
    await user.selectOptions(screen.getByLabelText(/discount type/i), "fixed");
    await user.clear(screen.getByLabelText(/discount value/i));
    await user.type(screen.getByLabelText(/discount value/i), "20");
    await user.type(screen.getByLabelText(/expiry date/i), "2026-12-31");
    await user.clear(screen.getByLabelText(/usage limit/i));
    await user.type(screen.getByLabelText(/usage limit/i), "100");
    await user.type(screen.getByLabelText(/campaign/i), "Welcome");
    await user.click(screen.getByRole("button", { name: /create code/i }));

    expect(api.createDiscountCode).toHaveBeenCalledWith({
      code: "WELCOME20",
      discountType: "fixed",
      discountValue: 20,
      expiresAt: "2026-12-31",
      usageLimit: 100,
      campaign: "Welcome",
    });
    expect(await screen.findByText(/created WELCOME20/i)).toBeInTheDocument();
  });
});
