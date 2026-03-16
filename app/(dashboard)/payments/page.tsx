"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

export default function PaymentsPage() {
  const [planId, setPlanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [error, setError] = useState("");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCheckoutUrl("");
    try {
      const res = await api.post<{ data: { checkout_url: string } }>("/api/payments/checkout", {
        plan_id: planId,
      });
      setCheckoutUrl(res.data.data.checkout_url);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Payments</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Upgrade or change your subscription plan.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {checkoutUrl && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm dark:bg-green-900/20">
          <p className="text-green-700 dark:text-green-400">Checkout ready.</p>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-medium text-green-700 underline dark:text-green-400"
          >
            Proceed to payment →
          </a>
        </div>
      )}

      <form onSubmit={handleCheckout} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Plan ID</label>
          <input
            type="text"
            required
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            placeholder="e.g. 1"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {loading ? "Processing..." : "Checkout"}
        </button>
      </form>
    </div>
  );
}
