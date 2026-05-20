import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createDiscountCode,
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
          discountType: "percentage",
          discountValue: 20,
          expiresAt: "2026-08-01",
          usageLimit: 10,
          redemptionCount: 3,
          campaign: "Summer",
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
  });

  it("creates, reads, redeems, and summarizes discount codes with the expected endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => okResponse({ id: "code-1" }))
      .mockImplementationOnce(() => okResponse({ id: "code-1", code: "VIP20" }))
      .mockImplementationOnce(() =>
        okResponse({
          code: { id: "code-1", code: "VIP20", redemptionCount: 1 },
          summary: { totalCodes: 1, totalRedemptions: 1, activeCodes: 1 },
        }),
      )
      .mockImplementationOnce(() =>
        okResponse({ totalCodes: 1, totalRedemptions: 1, activeCodes: 1 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await createDiscountCode({
      code: "VIP20",
      discountType: "percentage",
      discountValue: 20,
      expiresAt: "2026-12-31",
      usageLimit: 50,
      campaign: "VIP",
    });
    await getDiscountCode("code-1");
    await redeemDiscountCode("code-1");
    await getUsageSummary();

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
      "https://api.example.test/discount-codes/code-1/redeem",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "https://api.example.test/discount-codes/usage-summary",
      expect.objectContaining({ method: "GET" }),
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
