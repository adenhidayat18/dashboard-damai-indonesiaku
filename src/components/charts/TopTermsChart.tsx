"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TermFrequency } from "@/types";

interface Props {
  data: TermFrequency[];
}

export default function TopTermsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="card text-center py-8 text-[var(--color-text-muted)] text-sm">
        Belum ada kata/frasa yang cukup sering muncul.
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-semibold text-[var(--color-text)]">Top 10 Kata/Frasa Komentar</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Kata atau frasa yang paling sering muncul dalam komentar
        </p>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 8, bottom: 0, left: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#8b89a0" }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="term"
            width={150}
            tick={{ fontSize: 11, fill: "#8b89a0" }}
          />
          <Tooltip
            formatter={(v) => [`${v} kali`, "Frekuensi"]}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
