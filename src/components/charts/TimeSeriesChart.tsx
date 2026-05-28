"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from "recharts";
import type { TimeSeriesDataPoint } from "@/types";

interface Props {
  data: TimeSeriesDataPoint[];
}

export default function TimeSeriesChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="card text-center py-8 text-[var(--color-text-muted)] text-sm">
        Data time series tidak cukup (butuh minimal 2 tanggal berbeda).
      </div>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-semibold text-[var(--color-text)]">Tren Sentimen dari Waktu ke Waktu</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Dinamika respons audiens terhadap program Damai Indonesiaku
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {[
              { id: "positif", color: "#22c55e" },
              { id: "negatif", color: "#ef4444" },
              { id: "netral",  color: "#94a3b8" },
              { id: "ambigu",  color: "#f59e0b" },
            ].map(({ id, color }) => (
              <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: "#8b89a0" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: "#8b89a0" }} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={formatDate}
          />
          <Legend
            formatter={(v) => (
              <span className="text-xs text-[var(--color-text-muted)] capitalize">{v}</span>
            )}
          />
          {[
            { key: "positif", color: "#22c55e" },
            { key: "negatif", color: "#ef4444" },
            { key: "netral",  color: "#94a3b8" },
            { key: "ambigu",  color: "#f59e0b" },
          ].map(({ key, color }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${key})`}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
