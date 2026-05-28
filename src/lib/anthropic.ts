// ============================================================
// lib/anthropic.ts — AI Analysis Service (Server-side only)
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { RawComment, AnalyzedComment, NarrativeFrame, SentimentLabel } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Kamu adalah analis riset komunikasi dan media yang ahli dalam:
- Analisis sentimen komentar YouTube berbahasa Indonesia
- Studi mediatisasi agama dan konstruksi narasi Islam moderat
- Politik identitas dalam media digital Indonesia
- Framing media program religi televisi

Tugasmu menganalisis komentar YouTube dari program "Damai Indonesiaku" di TVOne/YouTube.
Konteks riset: Mediamorfosis TVOne ke YouTube — bagaimana audiens merespons konstruksi narasi Islam moderat di era neo-Fordisme.

Untuk setiap komentar, analisis:
1. SENTIMEN: positif / negatif / netral / ambigu
2. SKOR SENTIMEN: angka -1.0 (sangat negatif) hingga 1.0 (sangat positif)
3. NARRATIVE FRAMES yang muncul (bisa lebih dari satu):
   - islam_moderat: penerimaan/penolakan narasi Islam wasatiyah, rahmatan lil alamin
   - nasionalisme_religius: perpaduan nasionalisme dan keislaman
   - toleransi: wacana toleransi antaragama/antaretnis
   - anti_radikalisme: respons terhadap isu radikalisme/ekstremisme
   - identitas_politik: Islam sebagai identitas politik, polarisasi
   - kritik_media: kritik terhadap framing media, bias, propaganda
   - lainnya: tidak masuk kategori di atas
4. KEYWORDS: kata kunci penting (3-8 kata)
5. Apakah komentar MENERIMA narasi Islam moderat (true/false)
6. Apakah komentar menunjukkan POLITIK IDENTITAS (true/false)
7. PENJELASAN singkat analisis (1-2 kalimat)

Balas HANYA dengan JSON array, tanpa teks lain, tanpa markdown code block.`;

// Analisis batch komentar
export async function analyzeCommentsBatch(
  comments: RawComment[]
): Promise<AnalyzedComment[]> {
  const commentList = comments
    .map((c, i) => `[${i}] ${c.author}: "${c.text}"`)
    .join("\n");

  const userPrompt = `Analisis ${comments.length} komentar YouTube berikut dari program Damai Indonesiaku:

${commentList}

Balas dengan JSON array dengan ${comments.length} objek, format setiap objek:
{
  "index": 0,
  "sentiment": "positif|negatif|netral|ambigu",
  "sentimentScore": 0.0,
  "narrativeFrames": ["frame1", "frame2"],
  "keywords": ["kata1", "kata2"],
  "isModerateIslamNarrative": true,
  "isIdentityPolitics": false,
  "aiExplanation": "Penjelasan singkat..."
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    // Bersihkan response (hapus markdown fences jika ada)
    const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
    const analysisResults = JSON.parse(cleaned) as Array<{
      index: number;
      sentiment: SentimentLabel;
      sentimentScore: number;
      narrativeFrames: NarrativeFrame[];
      keywords: string[];
      isModerateIslamNarrative: boolean;
      isIdentityPolitics: boolean;
      aiExplanation: string;
    }>;

    return comments.map((comment, i) => {
      const analysis = analysisResults.find((r) => r.index === i) ?? {
        index: i,
        sentiment: "netral" as SentimentLabel,
        sentimentScore: 0,
        narrativeFrames: ["lainnya"] as NarrativeFrame[],
        keywords: [],
        isModerateIslamNarrative: false,
        isIdentityPolitics: false,
        aiExplanation: "Tidak dapat dianalisis.",
      };

      return {
        ...comment,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        narrativeFrames: analysis.narrativeFrames,
        keywords: analysis.keywords,
        isModerateIslamNarrative: analysis.isModerateIslamNarrative,
        isIdentityPolitics: analysis.isIdentityPolitics,
        aiExplanation: analysis.aiExplanation,
      };
    });
  } catch (error) {
    console.error("Anthropic API error:", error);
    // Fallback: kembalikan komentar dengan nilai default
    return comments.map((c) => ({
      ...c,
      sentiment: "netral" as SentimentLabel,
      sentimentScore: 0,
      narrativeFrames: ["lainnya"] as NarrativeFrame[],
      keywords: [],
      isModerateIslamNarrative: false,
      isIdentityPolitics: false,
      aiExplanation: "Gagal dianalisis.",
    }));
  }
}

// Proses semua komentar dalam batch
export async function analyzeAllComments(
  comments: RawComment[],
  batchSize = 15,
  onProgress?: (progress: number, total: number) => void
): Promise<AnalyzedComment[]> {
  const results: AnalyzedComment[] = [];

  for (let i = 0; i < comments.length; i += batchSize) {
    const batch = comments.slice(i, i + batchSize);
    const analyzed = await analyzeCommentsBatch(batch);
    results.push(...analyzed);
    onProgress?.(Math.min(i + batchSize, comments.length), comments.length);
  }

  return results;
}
