"use client";

import type { DashboardData } from "@/types";
import { formatNumber, formatPercentage } from "@/lib/utils";

interface Props {
  data: DashboardData;
}

export default function StatsOverview({ data }: Props) {
  const avgScore = data.avgSentimentScore;
  const scoreColor =
    avgScore > 0.1 ? "text-green-400" : avgScore < -0.1 ? "text-red-400" : "text-[var(--color-text-muted)]";

  const kolCounts = data.comments.reduce<Record<string, number>>((acc, c) => {
    const key = (c.kol || "").trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topKol = Object.entries(kolCounts).sort(([, a], [, b]) => b - a)[0];
  const topKolName = topKol?.[0] ?? "-";
  const topKolCount = topKol?.[1] ?? 0;

  const stats = [
    {
      label: "Total Komentar",
      value: formatNumber(data.totalComments),
      sub: `dari ${data.videoIds.length} video`,
      icon: "💬",
      color: "border-indigo-500/30",
    },
    {
      label: "Rata-rata Sentimen",
      value: avgScore.toFixed(3),
      sub: avgScore > 0 ? "Cenderung positif" : avgScore < 0 ? "Cenderung negatif" : "Netral",
      icon: "📊",
      color: "border-indigo-500/30",
      valueClass: scoreColor,
    },
    {
      label: "Terima Islam Moderat",
      value: formatPercentage(data.moderateIslamRate),
      sub: "dari total komentar",
      icon: "☮️",
      color: "border-green-500/30",
    },
    {
      label: "Politik Identitas",
      value: formatPercentage(data.identityPoliticsRate),
      sub: "dari total komentar",
      icon: "🏛️",
      color: "border-yellow-500/30",
    },
    {
      label: "Top KOL",
      value: topKolName,
      sub: topKolCount > 0 ? `${formatNumber(topKolCount)} komentar` : "Belum ada data KOL",
      icon: "🎯",
      color: "border-cyan-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`card border ${s.color} space-y-2 animate-slide-up`}
        >
          <div className="flex items-center justify-between">
            <span className="stat-label">{s.label}</span>
            <span className="text-lg">{s.icon}</span>
          </div>
          <p className={`stat-value ${s.valueClass ?? "text-[var(--color-text)]"}`}>
            {s.value}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
