// ============================================================
// Types: Damai Indonesiaku Research Dashboard
// ============================================================

// --- Raw YouTube Comment (dari CSV upload) ---
export interface RawComment {
  id: string;
  videoId: string;
  videoTitle?: string;
  videoDescription?: string;
  topic?: string;
  kol?: string;
  sourceSentiment?: string;
  author: string;
  text: string;
  likes: number;
  publishedAt: string;
  type?: string;
  pageUrl?: string;
  hasCreatorHeart?: boolean;
  authorIsChannelOwner?: boolean;
  replyCount?: number;
  isReply?: boolean;
  parentId?: string;
}

// --- Hasil Analisis Sentimen oleh AI ---
export type SentimentLabel = "positif" | "negatif" | "netral" | "ambigu";
export type NarrativeFrame =
  | "islam_moderat"
  | "nasionalisme_religius"
  | "toleransi"
  | "anti_radikalisme"
  | "identitas_politik"
  | "kritik_media"
  | "lainnya";

export interface AnalyzedComment extends RawComment {
  sentiment: SentimentLabel;
  sentimentScore: number; // -1.0 sampai 1.0
  narrativeFrames: NarrativeFrame[];
  keywords: string[];
  isModerateIslamNarrative: boolean;
  isIdentityPolitics: boolean;
  aiExplanation: string;
}

// --- Statistik Agregat ---
export interface SentimentDistribution {
  label: SentimentLabel;
  count: number;
  percentage: number;
}

export interface NarrativeFrameStats {
  frame: NarrativeFrame;
  count: number;
  avgSentimentScore: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  positif: number;
  negatif: number;
  netral: number;
  ambigu: number;
  total: number;
}

export interface KeywordFrequency {
  keyword: string;
  count: number;
  avgSentiment: number;
  dominantFrame: NarrativeFrame;
}

export interface MonthlyCommentDataPoint {
  month: string; // YYYY-MM
  count: number;
}

export interface TermFrequency {
  term: string;
  count: number;
}

// --- State Dashboard ---
export interface DashboardData {
  comments: AnalyzedComment[];
  totalComments: number;
  analyzedAt: string;
  videoIds: string[];
  sentimentDistribution: SentimentDistribution[];
  narrativeFrameStats: NarrativeFrameStats[];
  timeSeries: TimeSeriesDataPoint[];
  topKeywords: KeywordFrequency[];
  moderateIslamRate: number;    // % komentar yang menerima narasi Islam moderat
  identityPoliticsRate: number; // % komentar yang menunjukkan politik identitas
  avgSentimentScore: number;
  // Mediamorfosis: distribusi per episode/video
  videoStats: VideoStats[];
}

export interface VideoStats {
  videoId: string;
  title: string;
  totalComments: number;
  avgSentiment: number;
  topFrame: NarrativeFrame;
  publishedAt?: string;
}

// --- API Request/Response ---
export interface AnalyzeRequest {
  comments: RawComment[];
  batchSize?: number; // default 20
}

export interface AnalyzeResponse {
  success: boolean;
  data?: Partial<DashboardData>;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  comments?: RawComment[];
  count?: number;
  error?: string;
}

// --- Filter State (UI) ---
export interface FilterState {
  sentiment: SentimentLabel | "semua";
  sourceSentiment: SentimentLabel | "semua";
  narrativeFrame: NarrativeFrame | "semua";
  videoId: string | "semua";
  kol: string | "semua";
  topic: string | "semua";
  dateRange: { from: string; to: string } | null;
  searchQuery: string;
}
