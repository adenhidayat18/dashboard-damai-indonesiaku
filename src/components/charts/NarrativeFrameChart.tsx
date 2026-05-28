"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import type { NarrativeFrameStats, NarrativeFrame } from "@/types";

const FRAME_LABELS: Record<NarrativeFrame, string> = {
  islam_moderat:       "Islam Moderat",
  nasionalisme_religius: "Nasionalisme",
  toleransi:           "Toleransi",
  anti_radikalisme:    "Anti-Radikalisme",
  identitas_politik:   "Identitas Politik",
  kritik_media:        "Kritik Media",
  lainnya:             "Lainnya",
};

const FRAME_COLORS: Record<NarrativeFrame, string> = {
  islam_moderat:       "#6366f1",
  nasionalisme_religius: "#22c55e",
  toleransi:           "#3b82f6",
  anti_radikalisme:    "#ef4444",
  identitas_politik:   "#f59e0b",
  kritik_media:        "#8b5cf6",
  lainnya:             "#64748b",
};

interface Props {
  data: NarrativeFrameStats[];
}

export default function NarrativeFrameChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: FRAME_LABELS[d.frame] ?? d.frame,
    count: d.count,
    avgScore: parseFloat(d.avgSentimentScore.toFixed(3)),
    color: FRAME_COLORS[d.frame] ?? "#64748b",
    frame: d.frame,
  }));

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-semibold text-[var(--color-text)]">Bingkai Narasi (Narrative Frame)</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Frekuensi kemunculan konstruksi narasi dalam komentar
        </p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: "#8b89a0" }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10, fill: "#8b89a0" }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [value, name === "count" ? "Frekuensi" : name]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
