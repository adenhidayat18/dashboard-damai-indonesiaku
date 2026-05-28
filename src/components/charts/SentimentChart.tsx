"use client";

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import type { SentimentDistribution } from "@/types";
import { SENTIMENT_COLORS, SENTIMENT_LABELS_ID, formatPercentage } from "@/lib/utils";

interface Props {
  data: SentimentDistribution[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: SentimentDistribution }> }) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="card text-xs space-y-1 shadow-xl">
      <p className="font-medium text-[var(--color-text)]">{SENTIMENT_LABELS_ID[d.label]}</p>
      <p className="text-[var(--color-text-muted)]">
        {d.count} komentar ({formatPercentage(d.percentage)})
      </p>
    </div>
  );
};

export default function SentimentChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    name: SENTIMENT_LABELS_ID[d.label],
    fill: SENTIMENT_COLORS[d.label],
  }));

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-semibold text-[var(--color-text)]">Distribusi Sentimen</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Proporsi respons audiens terhadap program
        </p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-[var(--color-text-muted)]">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
