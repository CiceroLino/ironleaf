"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getDiscountCode,
  redeemDiscountCode,
} from "@/lib/discount-codes/api";
import {
  deriveStatus,
  formatDiscount,
  formatStatus,
} from "@/lib/discount-codes/format";
import type { DiscountCode } from "@/lib/discount-codes/types";

export function DiscountCodeDetail({ id }: { id: string }) {
  const [code, setCode] = useState<DiscountCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setCode(await getDiscountCode(id));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to load code");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id]);

  const handleRedeem = async () => {
    setError(null);
    setIsRedeeming(true);

    try {
      if (!code) {
        return;
      }

      const result = await redeemDiscountCode(code.code);
      setCode(result.code);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to redeem code");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          Back to dashboard
        </Link>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading discount code...</p>
          ) : null}

          {error ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {code ? (
            <div className="grid gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                    {code.campaign?.name ?? code.campaignId}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                    {code.code}
                  </h1>
                </div>
                <span className={statusClassName(deriveStatus(code))}>
                  {formatStatus(deriveStatus(code))}
                </span>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Discount"
                  value={formatDiscount(code.discountType, code.discountValue)}
                />
                <DetailItem label="Expires" value={code.expiresAt ?? "No expiry"} />
                <DetailItem
                  label="Usage"
                  value={`${code.redemptionCount} / ${code.usageLimit}`}
                />
              </dl>

              <div className="flex justify-end border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() => void handleRedeem()}
                  disabled={deriveStatus(code) !== "active" || isRedeeming}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isRedeeming ? "Redeeming..." : "Redeem code"}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function statusClassName(status: ReturnType<typeof deriveStatus>) {
  const base =
    "inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset";

  if (status === "active") {
    return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
  }

  if (status === "expired") {
    return `${base} bg-slate-100 text-slate-700 ring-slate-200`;
  }

  return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
