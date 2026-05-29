"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardData, FilterState, NarrativeFrame, NarrativeFrameStats, SentimentLabel, VideoStats } from "@/types";
import StatsOverview from "@/components/StatsOverview";
import SentimentChart from "@/components/charts/SentimentChart";
import MonthlyCommentsChart from "@/components/charts/MonthlyCommentsChart";
import TopTermsChart from "@/components/charts/TopTermsChart";
import KeywordCloud from "@/components/charts/KeywordCloud";
import CommentsTable from "@/components/CommentsTable";
import {
  formatNumber,
  calcSentimentDistribution,
  buildTimeSeries,
  buildMonthlyCommentSeries,
  extractTopKeywords,
  extractTopTermsFromComments,
  filterAnalyzedComments,
} from "@/lib/utils";

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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    sentiment: "semua",
    sourceSentiment: "semua",
    narrativeFrame: "semua",
    videoId: "semua",
    kol: "semua",
    topic: "semua",
    dateRange: null,
    searchQuery: "",
  });

  const filteredViewData = useMemo<DashboardData | null>(() => {
    if (!data) return null;
    const filteredComments = filterAnalyzedComments(data.comments, filter);
    return deriveDashboardData(data, filteredComments);
  }, [data, filter]);

  const monthlyComments = useMemo(() => {
    if (!filteredViewData) return [];
    return buildMonthlyCommentSeries(filteredViewData.comments);
  }, [filteredViewData]);

  const topTerms = useMemo(() => {
    if (!filteredViewData) return [];
    return extractTopTermsFromComments(filteredViewData.comments, 10);
  }, [filteredViewData]);

  const dateRangeLabel = useMemo(() => {
    if (!filteredViewData || filteredViewData.comments.length === 0) return "-";

    const validDates = filteredViewData.comments
      .map((c) => new Date(c.publishedAt))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (validDates.length === 0) return "-";

    const format = (d: Date) =>
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    return `${format(validDates[0])} - ${format(validDates[validDates.length - 1])}`;
  }, [filteredViewData]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoadingData(true);
      setError(null);

      try {
        const res = await fetch("/api/bootstrap-data", { cache: "no-store" });
        const json = await res.json();

        if (!isMounted) return;

        if (json.success && json.data) {
          setData(json.data as DashboardData);
        } else {
          setData(null);
          setError(json.error || "Gagal memuat data CSV dari direktori file.");
        }
      } catch {
        if (!isMounted) return;
        setData(null);
        setError("Gagal terhubung ke server saat memuat data awal.");
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

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

          {data && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {filteredViewData?.totalComments.toLocaleString("id-ID")} komentar ditampilkan
            </div>
          )}
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Loading State */}
        {isLoadingData && (
          <div className="card text-center py-12 space-y-4">
            <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-[var(--color-text)] font-medium">
                Memuat dan menganalisis semua CSV dari direktori file…
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Mohon tunggu sebentar…</p>
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
        {filteredViewData && !isLoadingData && (
          <div className="space-y-6 animate-fade-in">
            {/* Reset button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Hasil Analisis</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-ghost text-xs"
                >
                  Muat Ulang Data
                </button>
              </div>
            </div>

            {/* WAJIB 1 - Header Dashboard */}
            <section className="card border border-indigo-500/20 space-y-3">
              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text)]">
                Dashboard Analitik: Respons Publik terhadap Islam Moderat di Program Damai Indonesiaku
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-[var(--color-surface-2)] p-3">
                  <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wide">Sumber data</p>
                  <p className="text-[var(--color-text)] font-medium">YouTube / TVOne</p>
                </div>
                <div className="rounded-lg bg-[var(--color-surface-2)] p-3">
                  <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wide">Rentang waktu data</p>
                  <p className="text-[var(--color-text)] font-medium">{dateRangeLabel}</p>
                </div>
                <div className="rounded-lg bg-[var(--color-surface-2)] p-3">
                  <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wide">Total jumlah komentar</p>
                  <p className="text-[var(--color-text)] font-medium">
                    {formatNumber(filteredViewData.totalComments)}
                  </p>
                </div>
              </div>
            </section>

            {/* WAJIB 2 - Statistik Ringkasan */}
            <StatsOverview data={filteredViewData} />

            {/* WAJIB 2 - Distribusi komentar per bulan (line chart) */}
            <MonthlyCommentsChart data={monthlyComments} />

            {/* WAJIB 3 - Visualisasi Utama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TopTermsChart data={topTerms} />
              <SentimentChart data={filteredViewData.sentimentDistribution} />
            </div>

            {/* Keywords */}
            <KeywordCloud keywords={filteredViewData.topKeywords} />

            {/* Comments Table */}
            <CommentsTable
              comments={data?.comments ?? []}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>
        )}
      </main>
    </div>
  );
}
