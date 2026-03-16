"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Profile } from "@/types";
import { AxiosError } from "axios";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: Profile }>("/api/profile")
      .then((res) => {
        setProfile(res.data.data);
        const d = res.data.data;
        setForm({
          first_name: d.first_name ?? "",
          last_name: d.last_name ?? "",
          phone: d.phone ?? "",
          address: d.address ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api.post("/api/profile", form);
      setMessage("Profile updated.");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Profile</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Update your personal information.</p>

      {message && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {[
          { label: "First Name", key: "first_name" },
          { label: "Last Name", key: "last_name" },
          { label: "Phone", key: "phone" },
          { label: "Address", key: "address" },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
            <input
              type="text"
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      {profile?.avatar && (
        <div className="mt-6">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Avatar</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.avatar} alt="Avatar" className="mt-2 h-16 w-16 rounded-full object-cover" />
        </div>
      )}
    </div>
  );
}
