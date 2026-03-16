"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Subscription, SubscriptionPlan } from "@/types";

export default function SubscriptionsPage() {
  const [current, setCurrent] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Subscription }>("/api/subscription"),
      api.get<{ data: SubscriptionPlan[] }>("/api/subscription/plans"),
    ]).then(([subRes, plansRes]) => {
      setCurrent(subRes.data.data);
      setPlans(plansRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-zinc-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Subscriptions</h1>

      {current && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Current Plan</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{current.plan.name}</p>
          <p className="text-sm text-zinc-500">
            Status: <span className="capitalize">{current.status}</span>
            {current.expires_at && ` · Expires ${new Date(current.expires_at).toLocaleDateString()}`}
          </p>
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold text-zinc-900 dark:text-white">Available Plans</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <p className="font-semibold text-zinc-900 dark:text-white">{plan.name}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
              ₱{plan.price.toLocaleString()}
              <span className="text-sm font-normal text-zinc-400">/mo</span>
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              {plan.features?.map((f, i) => (
                <li key={i} className="text-sm text-zinc-500 dark:text-zinc-400">· {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
