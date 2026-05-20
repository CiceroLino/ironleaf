"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getDiscountCodes,
  getUsageSummary,
  redeemDiscountCode,
} from "@/lib/discount-codes/api";
import {
  deriveStatus,
  formatDiscount,
  formatStatus,
} from "@/lib/discount-codes/format";
import type { DiscountCode, UsageSummary } from "@/lib/discount-codes/types";

export function DiscountDashboard() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [nextCodes, nextSummary] = await Promise.all([
          getDiscountCodes(),
          getUsageSummary(),
        ]);
        setCodes(nextCodes);
        setSummary(nextSummary);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to load data");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const campaigns = useMemo(() => summary?.campaigns ?? [], [summary]);

  const handleRedeem = async (id: string) => {
    setRedeemError(null);
    setRedeemingId(id);

    try {
      const result = await redeemDiscountCode(id);
      setCodes((current) =>
        current.map((code) => (code.id === result.code.id ? result.code : code)),
      );

      if (result.summary) {
        setSummary(result.summary);
      } else {
        setSummary(await getUsageSummary());
      }
    } catch (caught) {
      setRedeemError(
        caught instanceof Error ? caught.message : "Unable to redeem code",
      );
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Campaign operations
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              Discount codes
            </h1>
          </div>
          <Link
            href="/discount-codes/new"
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            New code
          </Link>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {redeemError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {redeemError}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryMetric
            label="Total codes"
            value={summary?.totalCodes ?? 0}
            isLoading={isLoading}
          />
          <SummaryMetric
            label="Active codes"
            value={summary?.activeCodes ?? 0}
            isLoading={isLoading}
          />
          <SummaryMetric
            label="Expired"
            value={summary?.expiredCodes ?? 0}
            isLoading={isLoading}
          />
          <SummaryMetric
            label="Limit reached"
            value={summary?.usageLimitReachedCodes ?? 0}
            isLoading={isLoading}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                Code list
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {summary?.totalRedemptions ?? 0} total redemptions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Campaign</th>
                    <th className="px-5 py-3">Discount</th>
                    <th className="px-5 py-3">Expires</th>
                    <th className="px-5 py-3">Usage</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={7}>
                        Loading discount codes...
                      </td>
                    </tr>
                  ) : null}
                  {!isLoading && codes.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-500" colSpan={7}>
                        No discount codes found.
                      </td>
                    </tr>
                  ) : null}
                  {codes.map((code) => {
                    const status = deriveStatus(code);
                    const canRedeem = status === "active";

                    return (
                      <tr key={code.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-950">
                          <Link href={`/discount-codes/${code.id}`}>
                            {code.code}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                          {code.campaign}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                          {formatDiscount(code.discountType, code.discountValue)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                          {code.expiresAt}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                          {code.redemptionCount} / {code.usageLimit}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className={statusClassName(status)}>
                            {formatStatus(status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <button
                            type="button"
                            disabled={!canRedeem || redeemingId === code.id}
                            onClick={() => void handleRedeem(code.id)}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {redeemingId === code.id ? "Redeeming..." : "Redeem"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Campaign usage
            </h2>
            <div className="mt-4 grid gap-3">
              {campaigns.length === 0 ? (
                <p className="text-sm text-slate-500">No campaign usage yet.</p>
              ) : null}
              {campaigns.map((campaign) => (
                <div
                  key={campaign.campaign}
                  className="rounded-md border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">
                      {campaign.campaign}
                    </p>
                    <p className="text-sm text-slate-500">
                      {campaign.codeCount} codes
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {campaign.redemptionCount} redemptions
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SummaryMetric({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">
        {isLoading ? "-" : value}
      </p>
    </div>
  );
}

function statusClassName(status: ReturnType<typeof deriveStatus>) {
  const base =
    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";

  if (status === "active") {
    return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
  }

  if (status === "expired") {
    return `${base} bg-slate-100 text-slate-700 ring-slate-200`;
  }

  return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
}
