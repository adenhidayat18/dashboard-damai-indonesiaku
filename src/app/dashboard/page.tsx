"use client";

import { useMemo, useState } from "react";
import type { DashboardData, FilterState, NarrativeFrame, NarrativeFrameStats, SentimentLabel, VideoStats } from "@/types";
import CSVUploader from "@/components/CSVUploader";
import StatsOverview from "@/components/StatsOverview";
import SentimentChart from "@/components/charts/SentimentChart";
import NarrativeFrameChart from "@/components/charts/NarrativeFrameChart";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import KeywordCloud from "@/components/charts/KeywordCloud";
import CommentsTable from "@/components/CommentsTable";
import {
  calcSentimentDistribution,
  buildTimeSeries,
  extractTopKeywords,
  filterAnalyzedComments,
  normalizeSentimentLabel,
  sentimentScoreFromLabel,
} from "@/lib/utils";

type SentimentMode = "ai" | "source";

function deriveDashboardData(
  base: DashboardData,
  comments: DashboardData["comments"]
): DashboardData {
  const sentimentDistribution = calcSentimentDistribution(comments);
  const timeSeries = buildTimeSeries(comments);
  const topKeywords = extractTopKeywords(comments, 40);
  const avgSentimentScore =
    comments.reduce((sum, c) => sum + c.sentimentScore, 0) / Math.max(comments.length, 1);
  const moderateIslamRate =
    (comments.filter((c) => c.isModerateIslamNarrative).length / Math.max(comments.length, 1)) *
    100;
  const identityPoliticsRate =
    (comments.filter((c) => c.isIdentityPolitics).length / Math.max(comments.length, 1)) * 100;

  const frameMap: Record<string, { count: number; sentimentSum: number }> = {};
  for (const c of comments) {
    for (const f of c.narrativeFrames) {
      if (!frameMap[f]) frameMap[f] = { count: 0, sentimentSum: 0 };
      frameMap[f].count += 1;
      frameMap[f].sentimentSum += c.sentimentScore;
    }
  }

  const narrativeFrameStats: NarrativeFrameStats[] = Object.entries(frameMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([frame, { count, sentimentSum }]) => ({
      frame: frame as NarrativeFrame,
      count,
      avgSentimentScore: sentimentSum / count,
    }));

  const videoMap: Record<string, { comments: typeof comments; title: string }> = {};
  for (const c of comments) {
    const key = c.videoId || "unknown";
    if (!videoMap[key]) videoMap[key] = { comments: [], title: c.videoTitle || key };
    videoMap[key].comments.push(c);
  }

  const videoStats: VideoStats[] = Object.entries(videoMap).map(
    ([videoId, { comments: vComments, title }]) => {
      const avgSentiment =
        vComments.reduce((s, c) => s + c.sentimentScore, 0) / vComments.length;
      const frameCount: Record<string, number> = {};
      for (const c of vComments) {
        for (const f of c.narrativeFrames) {
          frameCount[f] = (frameCount[f] || 0) + 1;
        }
      }
      const topFrame = (
        Object.entries(frameCount).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "lainnya"
      ) as NarrativeFrame;

      return {
        videoId,
        title,
        totalComments: vComments.length,
        avgSentiment,
        topFrame,
      };
    }
  );

  return {
    ...base,
    comments,
    totalComments: comments.length,
    sentimentDistribution,
    narrativeFrameStats,
    timeSeries,
    topKeywords,
    moderateIslamRate,
    identityPoliticsRate,
    avgSentimentScore,
    videoStats,
    videoIds: [...new Set(comments.map((c) => c.videoId).filter(Boolean))],
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [sentimentMode, setSentimentMode] = useState<SentimentMode>("ai");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    sentiment: "semua",
    sourceSentiment: "semua",
    narrativeFrame: "semua",
    videoId: "semua",
    kol: "semua",
    dateRange: null,
    searchQuery: "",
  });

  const viewData = useMemo<DashboardData | null>(() => {
    if (!data) return null;
    if (sentimentMode === "ai") return data;

    const remappedComments = data.comments.map((c) => {
      const source = normalizeSentimentLabel(c.sourceSentiment);
      if (!source) return c;
      return {
        ...c,
        sentiment: source,
        sentimentScore: sentimentScoreFromLabel(source),
      };
    });

    return deriveDashboardData(data, remappedComments);
  }, [data, sentimentMode]);

  const filteredViewData = useMemo<DashboardData | null>(() => {
    if (!viewData) return null;
    const filteredComments = filterAnalyzedComments(viewData.comments, filter);
    return deriveDashboardData(viewData, filteredComments);
  }, [viewData, filter]);

  const handleDataReady = (newData: DashboardData) => {
    setData(newData);
    setIsAnalyzing(false);
    setError(null);
  };

  const handleAnalyzing = (current: number, total: number) => {
    setIsAnalyzing(true);
    setProgress({ current, total });
  };

  const handleError = (msg: string) => {
    setError(msg);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] sticky top-0 z-50 backdrop-blur-md bg-[var(--color-bg)]/80">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              DI
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[var(--color-text)]">
                Damai Indonesiaku
              </h1>
              <p className="text-xs text-[var(--color-text-muted)]">
                Research Dashboard
              </p>
            </div>
          </div>

          {viewData && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {filteredViewData?.totalComments.toLocaleString("id-ID")} komentar ditampilkan
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wide ${
                  sentimentMode === "source"
                    ? "border-cyan-500/40 text-cyan-300 bg-cyan-500/10"
                    : "border-indigo-500/40 text-indigo-300 bg-indigo-500/10"
                }`}
              >
                Mode: {sentimentMode === "source" ? "API" : "AI"}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Upload Section */}
        {!data && (
          <CSVUploader
            onDataReady={handleDataReady}
            onAnalyzing={handleAnalyzing}
            onError={handleError}
          />
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="card text-center py-12 space-y-4">
            <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-[var(--color-text)] font-medium">
                Menganalisis komentar dengan AI…
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {progress.current} / {progress.total} komentar
              </p>
            </div>
            <div className="w-64 h-1.5 bg-[var(--color-surface-2)] rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{
                  width:
                    progress.total > 0
                      ? `${(progress.current / progress.total) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card border-red-500/30 bg-red-500/5 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Dashboard Content */}
        {filteredViewData && !isAnalyzing && (
          <div className="space-y-6 animate-fade-in">
            {/* Reset button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Hasil Analisis</h2>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-[var(--color-border)] p-1 bg-[var(--color-surface-2)]">
                  {([
                    { key: "ai", label: "Sentiment AI" },
                    { key: "source", label: "Sentiment API" },
                  ] as Array<{ key: SentimentMode; label: string }>).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setSentimentMode(m.key)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                        sentimentMode === m.key
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setData(null)}
                  className="btn-ghost text-xs"
                >
                  ← Upload Data Baru
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview data={filteredViewData} />

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SentimentChart data={filteredViewData.sentimentDistribution} />
              <NarrativeFrameChart data={filteredViewData.narrativeFrameStats} />
            </div>

            {/* Time Series */}
            <TimeSeriesChart data={filteredViewData.timeSeries} />

            {/* Keywords */}
            <KeywordCloud keywords={filteredViewData.topKeywords} />

            {/* Comments Table */}
            <CommentsTable
              comments={viewData?.comments ?? []}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>
        )}
      </main>
    </div>
  );
}
