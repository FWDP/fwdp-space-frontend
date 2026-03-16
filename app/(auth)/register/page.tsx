"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AxiosError } from "axios";
import { ApiError } from "@/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.password_confirmation);
      router.push("/dashboard");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.message ?? "Registration failed.");
      setFieldErrors(axiosErr.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (key: string) =>
    fieldErrors[key]?.[0] ? (
      <p className="mt-1 text-xs text-red-500">{fieldErrors[key][0]}</p>
    ) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">Create account</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "Name", key: "name", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Password", key: "password", type: "password" },
            { label: "Confirm Password", key: "password_confirmation", type: "password" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label htmlFor={key} className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {label}
              </label>
              <input
                id={key}
                type={type}
                required
                value={form[key as keyof typeof form]}
                onChange={set(key)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white dark:focus:border-zinc-300"
              />
              {fieldError(key)}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline dark:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
