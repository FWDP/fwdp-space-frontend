"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Notification } from "@/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Notification[] }>("/api/notifications")
      .then((res) => setNotifications(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await api.post(`/api/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Notifications</h1>

      <div className="mt-6 flex flex-col gap-3">
        {notifications.length === 0 && (
          <p className="text-sm text-zinc-400">No notifications yet.</p>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between rounded-xl border p-4 ${
              n.read_at
                ? "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                : "border-blue-100 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
            }`}
          >
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {(n.data as { message?: string }).message ?? n.type}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
            {!n.read_at && (
              <button
                onClick={() => markRead(n.id)}
                className="ml-4 shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
