"use client";

import { useMemo, useState } from "react";
import type { AnalyzedComment, FilterState, SentimentLabel } from "@/types";
import { SENTIMENT_COLORS, SENTIMENT_LABELS_ID, truncate, filterAnalyzedComments } from "@/lib/utils";

interface Props {
  comments: AnalyzedComment[];
  filter: FilterState;
  onFilterChange: (f: FilterState) => void;
}

const SENTIMENT_OPTIONS: SentimentLabel[] = ["positif", "negatif", "netral", "ambigu"];

const PAGE_SIZE = 20;

export default function CommentsTable({ comments, filter, onFilterChange }: Props) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return filterAnalyzedComments(comments, filter);
  }, [comments, filter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const videoIds = [...new Set(comments.map((c) => c.videoId).filter(Boolean))];
  const kols = [...new Set(comments.map((c) => (c.kol || "").trim()).filter(Boolean))].sort();
  const topics = [...new Set(comments.map((c) => (c.topic || "").trim()).filter(Boolean))].sort();

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filter, [key]: value });
    setPage(1);
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-[var(--color-text)]">Komentar Teranalisis</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {filtered.length} komentar ditampilkan
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Cari komentar…"
          value={filter.searchQuery}
          onChange={(e) => updateFilter("searchQuery", e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-indigo-500/50 w-48"
        />
        <select
          value={filter.sentiment}
          onChange={(e) => updateFilter("sentiment", e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] focus:outline-none focus:border-indigo-500/50"
        >
          <option value="semua">Semua Sentimen</option>
          {SENTIMENT_OPTIONS.map((s) => (
            <option key={s} value={s}>{SENTIMENT_LABELS_ID[s]}</option>
          ))}
        </select>
        <select
          value={filter.sourceSentiment}
          onChange={(e) => updateFilter("sourceSentiment", e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] focus:outline-none focus:border-indigo-500/50"
        >
          <option value="semua">Semua Source Sentiment</option>
          {SENTIMENT_OPTIONS.map((s) => (
            <option key={s} value={s}>{SENTIMENT_LABELS_ID[s]}</option>
          ))}
        </select>
        {videoIds.length > 1 && (
          <select
            value={filter.videoId}
            onChange={(e) => updateFilter("videoId", e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] focus:outline-none focus:border-indigo-500/50"
          >
            <option value="semua">Semua Video</option>
            {videoIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        )}
        {kols.length > 0 && (
          <select
            value={filter.kol}
            onChange={(e) => updateFilter("kol", e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] focus:outline-none focus:border-indigo-500/50"
          >
            <option value="semua">Semua KOL</option>
            {kols.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
        {topics.length > 0 && (
          <select
            value={filter.topic}
            onChange={(e) => updateFilter("topic", e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] focus:outline-none focus:border-indigo-500/50"
          >
            <option value="semua">Semua Topic</option>
            {topics.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="space-y-2">
        {paginated.map((c) => {
          const isExpanded = expanded === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setExpanded(isExpanded ? null : c.id)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 cursor-pointer hover:border-indigo-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-[var(--color-text)]">{c.author}</span>
                    {c.videoTitle && (
                      <span className="text-xs text-[var(--color-text-muted)] truncate max-w-32">
                        {c.videoTitle}
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(c.publishedAt).toLocaleDateString("id-ID")}
                    </span>
                    {c.likes > 0 && (
                      <span className="text-xs text-[var(--color-text-muted)]">voteCount: {c.likes}</span>
                    )}
                    {(c.replyCount ?? 0) > 0 && (
                      <span className="text-xs text-[var(--color-text-muted)]">replyCount: {c.replyCount}</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text)]">
                    {isExpanded ? c.text : truncate(c.text, 140)}
                  </p>
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5">
                      {(c.sourceSentiment || c.kol || c.topic || c.videoDescription) && (
                        <div className="flex flex-wrap gap-1">
                          {c.sourceSentiment && (
                            <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              Source Sentiment: {c.sourceSentiment}
                            </span>
                          )}
                          {c.topic && (
                            <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Topic: {c.topic}
                            </span>
                          )}
                          {c.kol && (
                            <span className="badge bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                              KOL: {c.kol}
                            </span>
                          )}
                        </div>
                      )}
                      {c.videoDescription && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Deskripsi: {c.videoDescription}
                        </p>
                      )}
                      <p className="text-xs text-indigo-400 italic">{c.aiExplanation}</p>
                      <div className="flex flex-wrap gap-1">
                        {c.keywords.map((kw) => (
                          <span key={kw} className="badge bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span
                    className="badge text-white"
                    style={{ backgroundColor: SENTIMENT_COLORS[c.sentiment] + "33", color: SENTIMENT_COLORS[c.sentiment] }}
                  >
                    {SENTIMENT_LABELS_ID[c.sentiment]}
                  </span>
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">
                    {c.sentimentScore.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost px-3 py-1 text-xs disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-ghost px-3 py-1 text-xs disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
