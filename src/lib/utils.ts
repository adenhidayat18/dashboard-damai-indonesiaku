// ============================================================
// lib/utils.ts — Utility functions
// ============================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  RawComment,
  SentimentLabel,
  SentimentDistribution,
  AnalyzedComment,
  TimeSeriesDataPoint,
  KeywordFrequency,
  MonthlyCommentDataPoint,
  TermFrequency,
  FilterState,
  NarrativeFrame,
} from "@/types";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Warna per sentimen
export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  positif:  "#22c55e",
  negatif:  "#ef4444",
  netral:   "#94a3b8",
  ambigu:   "#f59e0b",
};

export const SENTIMENT_LABELS_ID: Record<SentimentLabel, string> = {
  positif: "Positif",
  negatif: "Negatif",
  netral:  "Netral",
  ambigu:  "Ambigu",
};

export function normalizeSentimentLabel(raw?: string): SentimentLabel | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  const normalized = v.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  if (
    [
      "positif",
      "positive",
      "very_positive",
      "highly_positive",
      "strong_positive",
      "mostly_positive",
      "sangat_positif",
      "pos",
      "pro",
      "1",
    ].includes(normalized)
  ) {
    return "positif";
  }
  if (
    [
      "negatif",
      "negative",
      "very_negative",
      "highly_negative",
      "strong_negative",
      "mostly_negative",
      "sangat_negatif",
      "neg",
      "kontra",
      "_1",
      "minus_1",
    ].includes(normalized)
  ) {
    return "negatif";
  }
  if (
    ["netral", "neutral", "neu", "none", "no_sentiment", "0"].includes(
      normalized
    )
  ) {
    return "netral";
  }
  if (
    [
      "ambigu",
      "mixed",
      "mixed_feelings",
      "ambivalent",
      "campuran",
      "unclear",
      "both",
    ].includes(normalized)
  ) {
    return "ambigu";
  }

  return undefined;
}

export function sentimentScoreFromLabel(label: SentimentLabel): number {
  switch (label) {
    case "positif":
      return 0.6;
    case "negatif":
      return -0.6;
    case "ambigu":
      return 0;
    case "netral":
    default:
      return 0;
  }
}

export function filterAnalyzedComments(
  comments: AnalyzedComment[],
  filter: FilterState
): AnalyzedComment[] {
  return comments.filter((c) => {
    if (filter.sentiment !== "semua" && c.sentiment !== filter.sentiment) return false;

    const sourceLabel = normalizeSentimentLabel(c.sourceSentiment);
    if (filter.sourceSentiment !== "semua" && sourceLabel !== filter.sourceSentiment) {
      return false;
    }

    if (
      filter.narrativeFrame !== "semua" &&
      !c.narrativeFrames.includes(filter.narrativeFrame as NarrativeFrame)
    ) {
      return false;
    }

    if (filter.videoId !== "semua" && c.videoId !== filter.videoId) return false;
    if (filter.kol !== "semua" && (c.kol || "").trim() !== filter.kol) return false;
    if (filter.topic !== "semua" && (c.topic || "").trim() !== filter.topic) return false;

    if (
      filter.searchQuery &&
      !c.text.toLowerCase().includes(filter.searchQuery.toLowerCase())
    ) {
      return false;
    }

    if (filter.dateRange) {
      const d = c.publishedAt.slice(0, 10);
      if (d < filter.dateRange.from || d > filter.dateRange.to) return false;
    }

    return true;
  });
}

// Format angka Indonesia
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function formatPercentage(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// Hitung distribusi sentimen
export function calcSentimentDistribution(
  comments: AnalyzedComment[]
): SentimentDistribution[] {
  const total = comments.length;
  if (total === 0) return [];

  const counts: Record<SentimentLabel, number> = {
    positif: 0, negatif: 0, netral: 0, ambigu: 0,
  };

  for (const c of comments) counts[c.sentiment]++;

  return (Object.entries(counts) as [SentimentLabel, number][]).map(
    ([label, count]) => ({
      label,
      count,
      percentage: (count / total) * 100,
    })
  );
}

// Buat time series dari komentar
export function buildTimeSeries(
  comments: AnalyzedComment[]
): TimeSeriesDataPoint[] {
  const byDate: Record<string, Record<SentimentLabel, number>> = {};

  for (const c of comments) {
    const date = c.publishedAt.slice(0, 10); // YYYY-MM-DD
    if (!byDate[date]) {
      byDate[date] = { positif: 0, negatif: 0, netral: 0, ambigu: 0 };
    }
    byDate[date][c.sentiment]++;
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      ...counts,
      total: counts.positif + counts.negatif + counts.netral + counts.ambigu,
    }));
}

// Ekstrak top keywords
export function extractTopKeywords(
  comments: AnalyzedComment[],
  topN = 30
): KeywordFrequency[] {
  const freq: Record<string, { count: number; sentimentSum: number; frames: Record<string, number> }> = {};

  for (const c of comments) {
    for (const kw of c.keywords) {
      const key = kw.toLowerCase();
      if (!freq[key]) freq[key] = { count: 0, sentimentSum: 0, frames: {} };
      freq[key].count++;
      freq[key].sentimentSum += c.sentimentScore;
      for (const f of c.narrativeFrames) {
        freq[key].frames[f] = (freq[key].frames[f] || 0) + 1;
      }
    }
  }

  return Object.entries(freq)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, topN)
    .map(([keyword, data]) => {
      const dominantFrame = Object.entries(data.frames).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] as KeywordFrequency["dominantFrame"] ?? "lainnya";
      return {
        keyword,
        count: data.count,
        avgSentiment: data.sentimentSum / data.count,
        dominantFrame,
      };
    });
}

const STOPWORDS_ID = new Set([
  "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "ini", "itu", "nya",
  "atau", "pada", "juga", "karena", "sudah", "belum", "aja", "saja", "agar", "biar",
  "adalah", "sebagai", "dalam", "lebih", "kurang", "bisa", "tidak", "ga", "gak",
  "nggak", "iya", "ya", "kita", "kami", "aku", "saya", "mereka", "dia", "anda",
  "buat", "jadi", "kalau", "jika", "semua", "hanya", "tentang", "sama", "masih",
  "udah", "banget", "pun", "lah", "deh", "dong", "nih", "sih", "kan", "kok",
  "www", "http", "https", "com", "youtube", "tvone",
]);

function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .filter((w) => !STOPWORDS_ID.has(w))
    .filter((w) => !/^\d+$/.test(w));
}

export function extractTopTermsFromComments(
  comments: AnalyzedComment[],
  topN = 10
): TermFrequency[] {
  const counts = new Map<string, number>();

  for (const c of comments) {
    const tokens = tokenizeText(c.text);

    for (const token of tokens) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }

    for (let i = 0; i < tokens.length - 1; i++) {
      const phrase = `${tokens[i]} ${tokens[i + 1]}`;
      counts.set(phrase, (counts.get(phrase) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([term, count]) => ({ term, count }));
}

export function buildMonthlyCommentSeries(
  comments: AnalyzedComment[]
): MonthlyCommentDataPoint[] {
  const byMonth: Record<string, number> = {};

  for (const c of comments) {
    const month = c.publishedAt.slice(0, 7); // YYYY-MM
    if (!month || month.length < 7) continue;
    byMonth[month] = (byMonth[month] || 0) + 1;
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

// Truncate teks panjang
export function truncate(text: string, maxLen = 120): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

// Parse CSV sederhana menggunakan PapaParse (wrapper)
export function parseCSVText(csvText: string): RawComment[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const comments: RawComment[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) ?? [];
    if (values.length < 3) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").replace(/^"|"$/g, "").trim();
    });

    comments.push({
      id: row["id"] || row["comment_id"] || `comment_${i}`,
      videoId: row["video_id"] || row["videoId"] || "",
      videoTitle: row["video_title"] || row["videoTitle"] || "",
      author: row["author"] || row["author_name"] || "Anonim",
      text: row["text"] || row["comment"] || row["comment_text"] || "",
      likes: parseInt(row["likes"] || row["like_count"] || "0", 10) || 0,
      publishedAt: row["published_at"] || row["publishedAt"] || row["date"] || new Date().toISOString(),
      replyCount: parseInt(row["reply_count"] || "0", 10) || 0,
      isReply: (row["is_reply"] || "false").toLowerCase() === "true",
      parentId: row["parent_id"] || undefined,
    });
  }

  return comments;
}
