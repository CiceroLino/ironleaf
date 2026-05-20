export type DiscountType = "PERCENT" | "FIXED";

export type DiscountStatus = "active" | "expired" | "usage_limit_reached";

export type DiscountCode = {
  id: string;
  code: string;
  campaignId: string;
  campaign?: Campaign;
  discountType: DiscountType;
  discountValue: number;
  currency?: string | null;
  expiresAt: string | null;
  usageLimit: number;
  redemptionCount: number;
  status?: DiscountStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateDiscountCodeInput = {
  code: string;
  campaignId: string;
  discountType: DiscountType;
  discountValue: number;
  currency?: string;
  expiresAt?: string;
  usageLimit: number;
};

export type Campaign = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCampaignInput = {
  name: string;
};

export type CampaignUsage = {
  campaign: string;
  codeCount: number;
  redemptionCount: number;
};

export type UsageSummary = {
  totalCodes: number;
  totalRedemptions: number;
  activeCodes: number;
  expiredCodes: number;
  usageLimitReachedCodes: number;
  campaigns: CampaignUsage[];
};

export type RedeemDiscountCodeResult = {
  redemptionId: string;
  redeemedAt: string;
  code: DiscountCode;
};
