import type { DiscountCode, DiscountStatus, DiscountType } from "./types";

export const formatDiscount = (type: DiscountType, value: number) => {
  if (type === "PERCENT") {
    return `${value}%`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export const formatStatus = (status: DiscountStatus) => {
  const labels: Record<DiscountStatus, string> = {
    active: "Active",
    expired: "Expired",
    usage_limit_reached: "Limit reached",
  };

  return labels[status];
};

export const deriveStatus = (code: DiscountCode): DiscountStatus => {
  if (code.redemptionCount >= code.usageLimit) {
    return "usage_limit_reached";
  }

  if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
    return "expired";
  }

  return code.status ?? "active";
};
