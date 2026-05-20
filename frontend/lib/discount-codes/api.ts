import type {
  Campaign,
  CreateCampaignInput,
  CreateDiscountCodeInput,
  DiscountCode,
  RedeemDiscountCodeResult,
  UsageSummary,
} from "./types";

type BackendRedeemResult = {
  id: string;
  redeemedAt: string;
  discountCode: DiscountCode;
};

type BackendCampaignUsage = {
  campaign: Campaign;
  totalDiscountCodes: number;
  totalRedemptions: number;
  discountCodes: Array<{
    code: string;
    redemptionCount: number;
    usageLimit?: number;
  }>;
};

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const getApiBaseUrl = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

  return baseUrl.replace(/\/$/, "");
};

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new ApiError(body?.message ?? "Request failed", response.status);
  }

  return (await response.json()) as T;
};

export const getDiscountCodes = () =>
  request<DiscountCode[]>("/discount-codes");

export const getDiscountCode = (id: string) =>
  request<DiscountCode>(`/discount-codes/${encodeURIComponent(id)}`);

export const createDiscountCode = (input: CreateDiscountCodeInput) =>
  request<DiscountCode>("/discount-codes", {
    method: "POST",
    body: input,
  });

export const redeemDiscountCode = async (code: string) => {
  const redemption = await request<BackendRedeemResult>(
    `/discount-codes/${encodeURIComponent(code)}/redeem`,
    { method: "POST" },
  );

  return {
    redemptionId: redemption.id,
    redeemedAt: redemption.redeemedAt,
    code: redemption.discountCode,
  } satisfies RedeemDiscountCodeResult;
};

export const getCampaigns = () => request<Campaign[]>("/campaigns");

export const createCampaign = (input: CreateCampaignInput) =>
  request<Campaign>("/campaigns", {
    method: "POST",
    body: input,
  });

export const getUsageSummary = async () => {
  const campaignUsage = await request<BackendCampaignUsage[]>(
    "/campaigns/usage-summary",
  );

  return campaignUsage.reduce<UsageSummary>(
    (summary, campaign) => {
      const expiredCodes = 0;
      const usageLimitReachedCodes = campaign.discountCodes.filter(
        (code) =>
          typeof code.usageLimit === "number" &&
          code.redemptionCount >= code.usageLimit,
      ).length;

      summary.totalCodes += campaign.totalDiscountCodes;
      summary.totalRedemptions += campaign.totalRedemptions;
      summary.expiredCodes += expiredCodes;
      summary.usageLimitReachedCodes += usageLimitReachedCodes;
      summary.activeCodes =
        summary.totalCodes - summary.expiredCodes - summary.usageLimitReachedCodes;
      summary.campaigns.push({
        campaign: campaign.campaign.name,
        codeCount: campaign.totalDiscountCodes,
        redemptionCount: campaign.totalRedemptions,
      });

      return summary;
    },
    {
      totalCodes: 0,
      totalRedemptions: 0,
      activeCodes: 0,
      expiredCodes: 0,
      usageLimitReachedCodes: 0,
      campaigns: [],
    },
  );
};
