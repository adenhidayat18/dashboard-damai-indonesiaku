import Papa from 'papaparse'

export interface DataRow {
  platform: string
  id: string
  text: string
  screen_name: string
  name: string
  is_verified: string
  account_type: string
  date: string
  retweets: string
  favorites: string
  replies: string
  quotes: string
  views: string
  url: string
  sentiment: 'pro_pandji' | 'anti_pandji' | 'skeptis' | 'netral'
  emotion: string
  valence: 'positive' | 'negative' | 'neutral'
  framing: string
}

export async function loadData(): Promise<{ twitter: DataRow[]; youtube: DataRow[] }> {
  const [twRes, ytRes] = await Promise.all([
    fetch('/data/twitter.csv'),
    fetch('/data/youtube.csv'),
  ])
  const [twText, ytText] = await Promise.all([twRes.text(), ytRes.text()])
  const parse = (text: string): DataRow[] => {
    const result = Papa.parse<DataRow>(text, { header: true, skipEmptyLines: true })
    return result.data
  }
  return { twitter: parse(twText), youtube: parse(ytText) }
}

export function getSentimentBreakdown(rows: DataRow[]) {
  const counts = { pro_pandji: 0, anti_pandji: 0, skeptis: 0, netral: 0 }
  rows.forEach(r => { if (r.sentiment in counts) counts[r.sentiment as keyof typeof counts]++ })
  return counts
}

export function getEmotionBreakdown(rows: DataRow[]) {
  const counts: Record<string, number> = {}
  rows.forEach(r => {
    if (r.emotion && r.emotion !== 'tidak_terdeteksi' && r.emotion !== 'informatif') {
      counts[r.emotion] = (counts[r.emotion] || 0) + 1
    }
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

export function getValenceBreakdown(rows: DataRow[]) {
  const counts = { positive: 0, negative: 0, neutral: 0 }
  rows.forEach(r => { if (r.valence in counts) counts[r.valence as keyof typeof counts]++ })
  return counts
}

export function getTimelineData(rows: DataRow[]) {
  const counts: Record<string, number> = {}
  rows.forEach(r => {
    if (r.date && r.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      counts[r.date] = (counts[r.date] || 0) + 1
    }
  })
  return Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))
}

export function getActorMentions(rows: DataRow[]) {
  const actors: Record<string, RegExp> = {
    'Pandji': /pandji/i,
    'Muhammadiyah': /muhammadiyah/i,
    'NU / Nahdlatul Ulama': /nahdlatul|\bnu\b/i,
    'Netflix': /netflix/i,
    'Polda / Polisi': /polda|polisi/i,
    'Mahfud MD': /mahfud/i,
    'Gibran': /gibran/i,
    'Yenny Wahid': /yenny/i,
  }
  return Object.entries(actors)
    .map(([actor, re]) => ({ actor, count: rows.filter(r => re.test(r.text)).length }))
    .sort((a, b) => b.count - a.count)
}

export function getFramingClusters(rows: DataRow[]) {
  const clusters: Record<string, number> = { hukum_pidana: 0, seni_kebebasan: 0, identitas_agama: 0 }
  rows.forEach(r => {
    r.framing?.split('|').forEach(f => { if (f in clusters) clusters[f]++ })
  })
  return [
    { cluster: 'Hukum & Pidana', count: clusters.hukum_pidana },
    { cluster: 'Seni & Kebebasan', count: clusters.seni_kebebasan },
    { cluster: 'Identitas Agama', count: clusters.identitas_agama },
  ]
}

export function getAccountTypeBreakdown(rows: DataRow[]) {
  return {
    media: rows.filter(r => r.account_type === 'media').length,
    publik: rows.filter(r => r.account_type === 'publik').length,
  }
}

export function getTopItems(rows: DataRow[], n = 5) {
  return [...rows]
    .sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0))
    .slice(0, n)
}
