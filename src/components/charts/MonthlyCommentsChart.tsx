"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyCommentDataPoint } from "@/types";

interface Props {
  data: MonthlyCommentDataPoint[];
}

export default function MonthlyCommentsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="card text-center py-8 text-[var(--color-text-muted)] text-sm">
        Data bulanan belum tersedia.
      </div>
    );
  }

  const formatMonth = (value: string) => {
    const date = new Date(`${value}-01T00:00:00Z`);
    return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  };

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-semibold text-[var(--color-text)]">Distribusi Komentar per Bulan</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Tren volume komentar publik setiap bulan
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fontSize: 10, fill: "#8b89a0" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: "#8b89a0" }} tickLine={false} allowDecimals={false} />
          <Tooltip
            labelFormatter={(v) => formatMonth(String(v))}
            formatter={(v) => [`${v} komentar`, "Jumlah"]}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#4f46e5"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
