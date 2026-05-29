import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import {
  calcSentimentDistribution,
  buildTimeSeries,
  extractTopKeywords,
  normalizeSentimentLabel,
  sentimentScoreFromLabel,
} from "@/lib/utils";
import type {
  AnalyzedComment,
  DashboardData,
  NarrativeFrame,
  NarrativeFrameStats,
  RawComment,
  SentimentLabel,
  VideoStats,
} from "@/types";

export const maxDuration = 300;
export const runtime = "nodejs";

function parseCsvText(text: string, sourceName: string): RawComment[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (!parsed.data || parsed.data.length === 0) return [];

  const toBool = (v: string): boolean => {
    const normalized = (v || "").trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  };

  const now = new Date();

  const parseRelativeDate = (v: string): Date | null => {
    const raw = (v || "")
      .trim()
      .toLowerCase()
      .replace(/\(edited\)/g, "")
      .trim();

    if (!raw) return null;
    if (raw === "just now") return new Date(now);

    const relativeMatch = raw.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/);
    if (!relativeMatch) return null;

    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2];
    const d = new Date(now);

    if (unit === "second") d.setSeconds(d.getSeconds() - amount);
    if (unit === "minute") d.setMinutes(d.getMinutes() - amount);
    if (unit === "hour") d.setHours(d.getHours() - amount);
    if (unit === "day") d.setDate(d.getDate() - amount);
    if (unit === "week") d.setDate(d.getDate() - amount * 7);
    if (unit === "month") d.setMonth(d.getMonth() - amount);
    if (unit === "year") d.setFullYear(d.getFullYear() - amount);

    return d;
  };

  const toIsoDateOrNow = (v: string): string => {
    const raw = (v || "").trim();
    if (!raw) return now.toISOString();

    const parsedRelative = parseRelativeDate(raw);
    if (parsedRelative) return parsedRelative.toISOString();

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

    return now.toISOString();
  };

  const extractVideoId = (url: string): string => {
    try {
      const u = new URL(url);
      const fromQuery = u.searchParams.get("v");
      if (fromQuery) return fromQuery;
      if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
      return "";
    } catch {
      return "";
    }
  };
  const comments: RawComment[] = [];

  parsed.data.forEach((rawRow, idx) => {
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawRow)) {
      const key = k.toLowerCase().replace(/\s+/g, "_");
      row[key] = String(v ?? "");
    }

    const content = row["text"] || row["comment"] || row["comment_text"] || row["komentar"] || "";
    if (!content) return;

    const pageUrl = row["page_url"] || row["pageurl"] || "";
    const videoIdFromUrl = extractVideoId(pageUrl);
    const publishedRaw =
      row["published_at"] ||
      row["date"] ||
      row["tanggal"] ||
      row["published_time_text"] ||
      row["publishedtimetext"] ||
      "";

    comments.push({
      id: row["id"] || row["comment_id"] || `${sourceName}_c_${idx + 1}`,
      videoId: row["video_id"] || row["videoid"] || videoIdFromUrl,
      videoTitle: row["video_title"] || row["judul"] || row["title"] || "",
      videoDescription:
        row["video_description"] || row["description"] || row["deskripsi_video"] || row["deskripsi"] || "",
      topic: row["topic"] || row["topik"] || row["video_topic"] || "",
      kol: row["kol"] || row["k_o_l"] || "",
      sourceSentiment: row["sentiment"] || row["sentiment_label"] || row["label_sentiment"] || "",
      author: row["author"] || row["author_name"] || row["username"] || "Anonim",
      text: content,
      likes: parseInt(row["likes"] || row["like_count"] || row["vote_count"] || row["votecount"] || "0", 10) || 0,
      publishedAt: toIsoDateOrNow(publishedRaw),
      type: row["type"] || undefined,
      pageUrl: pageUrl || undefined,
      hasCreatorHeart: toBool(row["has_creator_heart"] || row["hascreatorheart"] || ""),
      authorIsChannelOwner: toBool(row["author_is_channel_owner"] || row["authorischannelowner"] || ""),
      replyCount: parseInt(row["reply_count"] || row["replycount"] || "0", 10) || 0,
      isReply: toBool(row["is_reply"] || ""),
      parentId: row["parent_id"] || undefined,
    });
  });

  return comments;
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "file");
    const entries = await fs.readdir(dataDir, { withFileTypes: true });
    const csvFiles = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".csv"))
      .map((e) => e.name)
      .sort();

    if (csvFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada file CSV di direktori file." },
        { status: 404 }
      );
    }

    const allComments: RawComment[] = [];
    for (const fileName of csvFiles) {
      const abs = path.join(dataDir, fileName);
      const text = await fs.readFile(abs, "utf8");
      allComments.push(...parseCsvText(text, fileName.replace(/\.csv$/i, "")));
    }

    if (allComments.length === 0) {
      return NextResponse.json(
        { success: false, error: "CSV ditemukan tetapi tidak ada komentar valid." },
        { status: 400 }
      );
    }

    // Sentiment diambil langsung dari kolom CSV (tanpa AI sentiment).
    const analyzed: AnalyzedComment[] = allComments.map((c) => {
      const normalized = normalizeSentimentLabel(c.sourceSentiment) || ("netral" as SentimentLabel);
      const topicKeywords = (c.topic || "")
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);

      return {
        ...c,
        sentiment: normalized,
        sentimentScore: sentimentScoreFromLabel(normalized),
        narrativeFrames: ["lainnya"],
        keywords: topicKeywords,
        isModerateIslamNarrative: false,
        isIdentityPolitics: false,
        aiExplanation: "Sentiment diambil dari kolom source CSV.",
      };
    });

    const sentimentDistribution = calcSentimentDistribution(analyzed);
    const timeSeries = buildTimeSeries(analyzed);
    const topKeywords = extractTopKeywords(analyzed, 40);

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

    return NextResponse.json({ success: true, data: dashboardData, fileCount: csvFiles.length });
  } catch (err) {
    console.error("Bootstrap data API error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memuat CSV dari direktori file." },
      { status: 500 }
    );
  }
}
