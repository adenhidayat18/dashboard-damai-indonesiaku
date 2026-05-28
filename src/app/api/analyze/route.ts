import { NextRequest, NextResponse } from "next/server";
import { analyzeAllComments } from "@/lib/anthropic";
import {
  calcSentimentDistribution,
  buildTimeSeries,
  extractTopKeywords,
} from "@/lib/utils";
import type {
  RawComment,
  DashboardData,
  NarrativeFrame,
  VideoStats,
  NarrativeFrameStats,
} from "@/types";

export const maxDuration = 300; // 5 menit untuk analisis besar

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comments, batchSize = 15 }: { comments: RawComment[]; batchSize?: number } = body;

    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada komentar yang diterima." },
        { status: 400 }
      );
    }

    if (comments.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Maksimum 500 komentar per analisis. Silakan filter data Anda.",
        },
        { status: 400 }
      );
    }

    // Analisis dengan AI
    const analyzed = await analyzeAllComments(comments, batchSize);

    // Hitung statistik
    const sentimentDistribution = calcSentimentDistribution(analyzed);
    const timeSeries = buildTimeSeries(analyzed);
    const topKeywords = extractTopKeywords(analyzed, 40);

    // Hitung narrative frame stats
    const frameMap: Record<string, { count: number; sentimentSum: number }> = {};
    for (const c of analyzed) {
      for (const f of c.narrativeFrames) {
        if (!frameMap[f]) frameMap[f] = { count: 0, sentimentSum: 0 };
        frameMap[f].count++;
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

    // Stats per video
    const videoMap: Record<string, { comments: typeof analyzed; title: string }> = {};
    for (const c of analyzed) {
      const key = c.videoId || "unknown";
      if (!videoMap[key]) videoMap[key] = { comments: [], title: c.videoTitle || key };
      videoMap[key].comments.push(c);
    }
    const videoStats: VideoStats[] = Object.entries(videoMap).map(
      ([videoId, { comments: vComments, title }]) => {
        const avgSentiment =
          vComments.reduce((s, c) => s + c.sentimentScore, 0) / vComments.length;
        const frameCount: Record<string, number> = {};
        for (const c of vComments)
          for (const f of c.narrativeFrames)
            frameCount[f] = (frameCount[f] || 0) + 1;
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

    const moderateIslamRate =
      (analyzed.filter((c) => c.isModerateIslamNarrative).length / analyzed.length) * 100;
    const identityPoliticsRate =
      (analyzed.filter((c) => c.isIdentityPolitics).length / analyzed.length) * 100;
    const avgSentimentScore =
      analyzed.reduce((s, c) => s + c.sentimentScore, 0) / analyzed.length;

    const dashboardData: DashboardData = {
      comments: analyzed,
      totalComments: analyzed.length,
      analyzedAt: new Date().toISOString(),
      videoIds: [...new Set(analyzed.map((c) => c.videoId).filter(Boolean))],
      sentimentDistribution,
      narrativeFrameStats,
      timeSeries,
      topKeywords,
      moderateIslamRate,
      identityPoliticsRate,
      avgSentimentScore,
      videoStats,
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (err) {
    console.error("Analyze API error:", err);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat menganalisis data." },
      { status: 500 }
    );
  }
}
