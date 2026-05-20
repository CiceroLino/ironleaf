export type DiscountType = "percentage" | "fixed";

export type DiscountStatus = "active" | "expired" | "usage_limit_reached";

export type DiscountCode = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiresAt: string;
  usageLimit: number;
  redemptionCount: number;
  campaign: string;
  status: DiscountStatus;
};

export type CreateDiscountCodeInput = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiresAt: string;
  usageLimit: number;
  campaign: string;
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
  code: DiscountCode;
  summary?: UsageSummary;
};
