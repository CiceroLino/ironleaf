import type {
  CreateDiscountCodeInput,
  DiscountCode,
  RedeemDiscountCodeResult,
  UsageSummary,
} from "./types";

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

export const redeemDiscountCode = (id: string) =>
  request<RedeemDiscountCodeResult>(
    `/discount-codes/${encodeURIComponent(id)}/redeem`,
    { method: "POST" },
  );

export const getUsageSummary = () =>
  request<UsageSummary>("/discount-codes/usage-summary");
