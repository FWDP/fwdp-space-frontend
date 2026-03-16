"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
        Welcome back{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Here&apos;s what&apos;s happening with your account.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Account", value: user?.email ?? "—" },
          { label: "Role", value: user?.role ?? "—" },
          { label: "Member since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white truncate">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
