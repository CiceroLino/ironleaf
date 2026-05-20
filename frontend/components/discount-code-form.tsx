"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  createCampaign,
  createDiscountCode,
  getCampaigns,
} from "@/lib/discount-codes/api";
import type {
  Campaign,
  CreateDiscountCodeInput,
  DiscountCode,
  DiscountType,
} from "@/lib/discount-codes/types";

const initialForm: CreateDiscountCodeInput = {
  code: "",
  campaignId: "",
  discountType: "PERCENT",
  discountValue: 10,
  expiresAt: "",
  usageLimit: 100,
};

const newCampaignValue = "__new_campaign__";

export function DiscountCodeForm() {
  const [form, setForm] = useState<CreateDiscountCodeInput>(initialForm);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [createdCode, setCreatedCode] = useState<DiscountCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const nextCampaigns = await getCampaigns();
        setCampaigns(nextCampaigns);
        setForm((current) => ({
          ...current,
          campaignId: current.campaignId || nextCampaigns[0]?.id || "",
        }));
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Unable to load campaigns",
        );
      }
    };

    void loadCampaigns();
  }, []);

  const updateForm = <Key extends keyof CreateDiscountCodeInput>(
    key: Key,
    value: CreateDiscountCodeInput[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCampaignDialog = () => {
    setCampaignError(null);
    setCampaignName("");
    setIsCampaignDialogOpen(true);
  };

  const closeCampaignDialog = () => {
    setCampaignError(null);
    setCampaignName("");
    setIsCampaignDialogOpen(false);
  };

  const handleCampaignChange = (value: string) => {
    if (value === newCampaignValue) {
      openCampaignDialog();
      return;
    }

    updateForm("campaignId", value);
  };

  const handleCreateCampaign = async () => {
    const name = campaignName.trim();

    if (!name) {
      setCampaignError("Campaign name is required");
      return;
    }

    setCampaignError(null);
    setIsCreatingCampaign(true);

    try {
      const campaign = await createCampaign({ name });
      setCampaigns((current) => [...current, campaign]);
      updateForm("campaignId", campaign.id);
      closeCampaignDialog();
    } catch (caught) {
      setCampaignError(
        caught instanceof Error ? caught.message : "Unable to create campaign",
      );
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setCreatedCode(null);
    setIsSubmitting(true);

    try {
      const created = await createDiscountCode({
        ...form,
        code: form.code.trim().toUpperCase(),
        currency: form.discountType === "FIXED" ? "USD" : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      setCreatedCode(created);
      setForm(initialForm);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-950">
          Create discount code
        </h1>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {createdCode ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Created {createdCode.code}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Code
          <input
            value={form.code}
            onChange={(event) => updateForm("code", event.target.value)}
            required
            className="h-11 rounded-md border border-slate-300 px-3 text-slate-950 outline-none ring-emerald-500 transition focus:ring-2"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Campaign
          <select
            value={form.campaignId}
            onChange={(event) => handleCampaignChange(event.target.value)}
            required
            className="h-11 rounded-md border border-slate-300 px-3 text-slate-950 outline-none ring-emerald-500 transition focus:ring-2"
          >
            <option value="" disabled>
              Select a campaign
            </option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
            <option value={newCampaignValue}>Add new campaign...</option>
          </select>
          {campaigns.length === 0 ? (
            <span className="flex items-center justify-between gap-3 text-sm font-normal text-slate-500">
              No campaigns yet.
              <button
                type="button"
                onClick={openCampaignDialog}
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Add campaign
              </button>
            </span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Discount type
          <select
            value={form.discountType}
            onChange={(event) =>
              updateForm("discountType", event.target.value as DiscountType)
            }
            className="h-11 rounded-md border border-slate-300 px-3 text-slate-950 outline-none ring-emerald-500 transition focus:ring-2"
          >
            <option value="PERCENT">Percentage</option>
            <option value="FIXED">Fixed amount</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Discount value
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.discountValue}
            onChange={(event) =>
              updateForm("discountValue", Number(event.target.value))
            }
            required
            className="h-11 rounded-md border border-slate-300 px-3 text-slate-950 outline-none ring-emerald-500 transition focus:ring-2"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Expiry date
          <input
            type="date"
            value={form.expiresAt}
            onChange={(event) => updateForm("expiresAt", event.target.value)}
            required
            className="h-11 rounded-md border border-slate-300 px-3 text-slate-950 outline-none ring-emerald-500 transition focus:ring-2"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Usage limit
          <input
            type="number"
            min="1"
            value={form.usageLimit}
            onChange={(event) =>
              updateForm("usageLimit", Number(event.target.value))
            }
            required
            className="h-11 rounded-md border border-slate-300 px-3 text-slate-950 outline-none ring-emerald-500 transition focus:ring-2"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Creating..." : "Create code"}
        </button>
      </div>

      {isCampaignDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-dialog-title"
          className="fixed inset-0 z-10 grid place-items-center bg-slate-950/45 px-4"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="campaign-dialog-title"
                  className="text-lg font-semibold text-slate-950"
                >
                  Add campaign
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Create a campaign before assigning this discount code.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCampaignDialog}
                className="rounded-md px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {campaignError ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {campaignError}
              </div>
            ) : null}

            <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
              Campaign name
              <input
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                className="h-11 rounded-md border border-slate-300 px-3 text-slate-950 outline-none ring-emerald-500 transition focus:ring-2"
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCampaignDialog}
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreateCampaign()}
                disabled={isCreatingCampaign}
                className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isCreatingCampaign ? "Creating..." : "Create campaign"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
