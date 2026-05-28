"use client";

import type { KeywordFrequency } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  keywords: KeywordFrequency[];
}

export default function KeywordCloud({ keywords }: Props) {
  if (!keywords.length) return null;

  const maxCount = Math.max(...keywords.map((k) => k.count));

  const getSizeClass = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-2xl font-bold";
    if (ratio > 0.4) return "text-lg font-semibold";
    if (ratio > 0.2) return "text-base font-medium";
    return "text-sm";
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.2)  return "text-green-400 bg-green-500/10";
    if (score < -0.2) return "text-red-400 bg-red-500/10";
    return "text-[var(--color-text-muted)] bg-[var(--color-surface-2)]";
  };

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-semibold text-[var(--color-text)]">Peta Kata Kunci</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Ukuran = frekuensi, warna = rata-rata sentimen
        </p>
      </div>
      <div className="flex flex-wrap gap-2 py-2">
        {keywords.map((kw) => (
          <span
            key={kw.keyword}
            title={`${kw.count}×, sentimen: ${kw.avgSentiment.toFixed(2)}, frame: ${kw.dominantFrame}`}
            className={cn(
              "px-2.5 py-1 rounded-lg cursor-default transition-transform hover:scale-105",
              getSizeClass(kw.count),
              getSentimentColor(kw.avgSentiment)
            )}
          >
            {kw.keyword}
          </span>
        ))}
      </div>
      <div className="flex gap-4 text-xs text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]">
        <span><span className="text-green-400">■</span> Sentimen positif</span>
        <span><span className="text-red-400">■</span> Sentimen negatif</span>
        <span><span className="text-[var(--color-text-muted)]">■</span> Netral</span>
      </div>
    </div>
  );
}
