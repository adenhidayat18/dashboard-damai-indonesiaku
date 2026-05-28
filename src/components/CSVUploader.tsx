"use client";

import { useState, useRef, useCallback } from "react";
import type { DashboardData, RawComment } from "@/types";

interface Props {
  onDataReady: (data: DashboardData) => void;
  onAnalyzing: (current: number, total: number) => void;
  onError: (msg: string) => void;
}

export default function CSVUploader({ onDataReady, onAnalyzing, onError }: Props) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<RawComment[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseCSV = useCallback((text: string): RawComment[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const toBool = (v: string): boolean => {
      const normalized = (v || "").trim().toLowerCase();
      return normalized === "true" || normalized === "1" || normalized === "yes";
    };

    const toIsoDateOrNow = (v: string): string => {
      const raw = (v || "").trim();
      if (!raw) return new Date().toISOString();
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
      return parsed.toISOString();
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

    // Parse header (handle quoted fields)
    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const comments: RawComment[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseRow(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });

      const text =
        row["text"] || row["comment"] || row["comment_text"] || row["komentar"] || "";
      if (!text) continue;

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
        id: row["id"] || row["comment_id"] || `c_${i}`,
        videoId: row["video_id"] || row["videoid"] || videoIdFromUrl,
        videoTitle: row["video_title"] || row["judul"] || row["title"] || "",
        videoDescription:
          row["video_description"] || row["description"] || row["deskripsi_video"] || row["deskripsi"] || "",
        kol: row["kol"] || row["k_o_l"] || "",
        sourceSentiment: row["sentiment"] || row["sentiment_label"] || row["label_sentiment"] || "",
        author: row["author"] || row["author_name"] || row["username"] || "Anonim",
        text,
        likes: parseInt(row["likes"] || row["like_count"] || row["vote_count"] || row["votecount"] || "0") || 0,
        publishedAt: toIsoDateOrNow(publishedRaw),
        type: row["type"] || undefined,
        pageUrl: pageUrl || undefined,
        hasCreatorHeart: toBool(row["has_creator_heart"] || row["hascreatorheart"] || ""),
        authorIsChannelOwner: toBool(row["author_is_channel_owner"] || row["authorischannelowner"] || ""),
        replyCount: parseInt(row["reply_count"] || row["replycount"] || "0") || 0,
        isReply: toBool(row["is_reply"] || ""),
        parentId: row["parent_id"] || undefined,
      });
    }
    return comments;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        onError("Hanya file CSV yang didukung.");
        return;
      }
      setFileName(file.name);
      const text = await file.text();
      const comments = parseCSV(text);
      if (comments.length === 0) {
        onError("Tidak ada komentar valid ditemukan dalam file CSV.");
        return;
      }
      setPreview(comments.slice(0, 3));

      // Kirim ke API
      onAnalyzing(0, comments.length);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments, batchSize: 15 }),
        });
        const json = await res.json();
        if (json.success) {
          onDataReady(json.data);
        } else {
          onError(json.error || "Analisis gagal.");
        }
      } catch {
        onError("Gagal terhubung ke server analisis.");
      }
    },
    [parseCSV, onAnalyzing, onDataReady, onError]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Research context header */}
      <div className="text-center space-y-2 py-8">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--color-gold)]" />
          <span className="text-[var(--color-gold)] text-xs font-medium tracking-widest uppercase">
            Upload Data
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--color-gold)]" />
        </div>
        <h2 className="text-2xl font-bold">Mulai Analisis Komentar</h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
          Upload file CSV berisi komentar YouTube dari program Damai Indonesiaku
          untuk dianalisis menggunakan AI.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          card cursor-pointer border-dashed transition-all duration-200 py-12 text-center
          ${dragging
            ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
            : "hover:border-indigo-500/40 hover:bg-indigo-500/5"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div className="space-y-3">
          <div className="text-4xl">📊</div>
          <div>
            <p className="font-medium text-[var(--color-text)]">
              {fileName ? `✓ ${fileName}` : "Tarik & lepas file CSV di sini"}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              atau klik untuk memilih file
            </p>
          </div>
        </div>
      </div>

      {/* CSV Format Guide */}
      <div className="card space-y-3">
        <p className="stat-label">Format CSV yang Didukung</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Kolom yang dikenali (nama bisa bervariasi):
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            ["id / comment_id", "ID komentar"],
            ["text / comment", "Teks komentar *"],
            ["author / username", "Nama pengguna"],
            ["video_id / pageUrl", "ID video atau URL YouTube"],
            ["video_title / judul / title", "Judul video"],
            ["description / deskripsi", "Deskripsi video"],
            ["published_at / date / publishedTimeText", "Tanggal posting"],
            ["likes / like_count / voteCount", "Jumlah likes"],
            ["sentiment", "Sentimen dari API sumber"],
            ["kol", "KOL/Kreator terkait"],
            ["is_reply / authorIsChannelOwner", "true/false"],
          ].map(([field, desc]) => (
            <div key={field} className="text-xs">
              <code className="font-mono text-indigo-400">{field}</code>
              <p className="text-[var(--color-text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-yellow-500/80">* Kolom wajib ada</p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="card space-y-2">
          <p className="stat-label">Preview (3 baris pertama)</p>
          {preview.map((c, i) => (
            <div key={i} className="text-xs bg-[var(--color-surface-2)] rounded-lg p-3 space-y-1">
              <p className="text-[var(--color-text-muted)]">{c.author} • {c.videoTitle}</p>
              <p className="text-[var(--color-text)]">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
