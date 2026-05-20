import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createCampaign,
  createDiscountCode,
  getCampaigns,
  getDiscountCode,
  getDiscountCodes,
  getUsageSummary,
  redeemDiscountCode,
} from "./api";

const okResponse = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

describe("discount code API client", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches discount codes from the configured API base URL", async () => {
    const fetchMock = vi.fn(() =>
      okResponse([
        {
          id: "code-1",
          code: "SUMMER20",
          campaignId: "campaign-1",
          campaign: { id: "campaign-1", name: "Summer" },
          discountType: "PERCENT",
          discountValue: 20,
          expiresAt: "2026-08-01",
          usageLimit: 10,
          redemptionCount: 3,
          status: "active",
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const codes = await getDiscountCodes();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/discount-codes",
      expect.objectContaining({ method: "GET" }),
    );
    expect(codes).toHaveLength(1);
    expect(codes[0].code).toBe("SUMMER20");
    expect(codes[0].campaign?.name).toBe("Summer");
  });

  it("defaults to the local backend on port 3000 when no API base URL is configured", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const fetchMock = vi.fn(() => okResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await getDiscountCodes();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/discount-codes",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates, reads, redeems, and summarizes discount codes with the expected endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => okResponse({ id: "code-1" }))
      .mockImplementationOnce(() => okResponse({ id: "code-1", code: "VIP20" }))
      .mockImplementationOnce(() =>
        okResponse({
          id: "redemption-1",
          redeemedAt: "2026-05-20T00:00:00.000Z",
          discountCode: { id: "code-1", code: "VIP20", redemptionCount: 1 },
        }),
      )
      .mockImplementationOnce(() =>
        okResponse([
          {
            campaign: { id: "campaign-1", name: "VIP" },
            totalDiscountCodes: 1,
            totalRedemptions: 1,
            discountCodes: [{ code: "VIP20", redemptionCount: 1 }],
          },
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    await createDiscountCode({
      code: "VIP20",
      campaignId: "campaign-1",
      discountType: "PERCENT",
      discountValue: 20,
      expiresAt: "2026-12-31",
      usageLimit: 50,
    });
    await getDiscountCode("code-1");
    const redemption = await redeemDiscountCode("VIP20");
    const summary = await getUsageSummary();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/discount-codes",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/discount-codes/code-1",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.example.test/discount-codes/VIP20/redeem",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "https://api.example.test/campaigns/usage-summary",
      expect.objectContaining({ method: "GET" }),
    );
    expect(redemption.code.code).toBe("VIP20");
    expect(summary).toMatchObject({
      totalCodes: 1,
      totalRedemptions: 1,
      campaigns: [{ campaign: "VIP", codeCount: 1, redemptionCount: 1 }],
    });
  });

  it("creates and lists campaigns with the backend campaign endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        okResponse([{ id: "campaign-1", name: "Paid Social" }]),
      )
      .mockImplementationOnce(() =>
        okResponse({ id: "campaign-2", name: "Email Retention" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await getCampaigns();
    await createCampaign({ name: "Email Retention" });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/campaigns",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/campaigns",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws API errors with backend messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: "Code is expired" }), {
            status: 422,
          }),
        ),
      ),
    );

    await expect(redeemDiscountCode("code-1")).rejects.toMatchObject({
      message: "Code is expired",
      status: 422,
    } satisfies Partial<ApiError>);
  });
});
