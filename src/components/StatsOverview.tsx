"use client";

import type { DashboardData } from "@/types";
import { formatNumber } from "@/lib/utils";

interface Props {
  data: DashboardData;
}

export default function StatsOverview({ data }: Props) {
  const avgLikes = data.totalComments > 0
    ? data.comments.reduce((sum, c) => sum + c.likes, 0) / data.totalComments
    : 0;
  const uniqueUsers = new Set(
    data.comments.map((c) => (c.author || "").trim().toLowerCase()).filter(Boolean)
  ).size;

  const stats = [
    {
      label: "Total Komentar",
      value: formatNumber(data.totalComments),
      sub: "total komentar terhimpun",
      icon: "💬",
      color: "border-indigo-500/30",
    },
    {
      label: "Rata-rata Likes/Komentar",
      value: avgLikes.toFixed(2),
      sub: "rerata interaksi per komentar",
      icon: "👍",
      color: "border-blue-500/30",
    },
    {
      label: "Pengguna Unik",
      value: formatNumber(uniqueUsers),
      sub: "akun unik yang berkomentar",
      icon: "👤",
      color: "border-emerald-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`card border ${s.color} space-y-2 animate-slide-up`}
        >
          <div className="flex items-center justify-between">
            <span className="stat-label">{s.label}</span>
            <span className="text-lg">{s.icon}</span>
          </div>
          <p className="stat-value text-[var(--color-text)]">
            {s.value}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
