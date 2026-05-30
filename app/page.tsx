"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  DataRow,
  getAccountTypeBreakdown,
  getActorMentions,
  getEmotionBreakdown,
  getFramingClusters,
  getSentimentBreakdown,
  getTimelineData,
  getValenceBreakdown,
  loadData,
} from "@/lib/dataProcessor"

const C = {
  bg: "#0b1220",
  bgSoft: "#111a2d",
  surface: "#17233b",
  border: "#2b3a5a",
  text: "#f3f6fc",
  muted: "#b2bfd8",
  accent: "#d9ae63",
  accentSoft: "#f3dfb6",
  pro: "#4ade80",
  anti: "#f87171",
  skeptis: "#fbbf24",
  netral: "#8ea1c5",
  pos: "#34d399",
  neg: "#fb7185",
  neu: "#94a3b8",
}

const SENT_COLORS: Record<string, string> = {
  pro_pandji: C.pro,
  anti_pandji: C.anti,
  skeptis: C.skeptis,
  netral: C.netral,
}
const SENT_LABELS: Record<string, string> = {
  pro_pandji: "Pro-Pandji",
  anti_pandji: "Anti-Pandji",
  skeptis: "Skeptis Pelapor",
  netral: "Netral",
}
const EMOT_COLORS: Record<string, string> = {
  kemarahan: "#f87171",
  penghinaan: "#fb923c",
  kekhawatiran: "#a78bfa",
  dukungan: "#4ade80",
  ejekan_ironi: "#fbbf24",
  kekecewaan: "#60a5fa",
  kelegaan: "#34d399",
  informatif: "#94a3b8",
}
const EMOT_LABELS: Record<string, string> = {
  kemarahan: "Kemarahan",
  penghinaan: "Penghinaan",
  kekhawatiran: "Kekhawatiran",
  dukungan: "Dukungan",
  ejekan_ironi: "Ejekan/Ironi",
  kekecewaan: "Kekecewaan",
  kelegaan: "Kelegaan",
  informatif: "Informatif",
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}rb` : String(n))
const csvEsc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
const F = {
  sans: "Source Sans 3, sans-serif",
  meta: { fontFamily: "Source Sans 3, sans-serif", lineHeight: 1.45, letterSpacing: "0.01em" },
  caps: { fontFamily: "Source Sans 3, sans-serif", lineHeight: 1.35, letterSpacing: "0.12em" },
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-md text-[11px] leading-[1.35] font-medium"
      style={{ background: `${color}1f`, color, border: `1px solid ${color}55` }}
    >
      {label}
    </span>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-[0_14px_35px_rgba(4,8,17,0.35)] ${className}`}
      style={{ background: `linear-gradient(180deg, ${C.surface}, ${C.bgSoft})`, borderColor: C.border }}
    >
      {children}
    </div>
  )
}

function Sec({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2"
      style={{ color: C.accentSoft, fontFamily: F.sans, letterSpacing: "0.01em", lineHeight: 1.25 }}
    >
      <span className="w-1.5 h-5 rounded-full inline-block" style={{ background: C.accent }} />
      {children}
    </h2>
  )
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-sm shadow-xl" style={{ background: "#1c2944", border: `1px solid ${C.border}`, color: C.text }}>
      <p className="font-medium mb-1" style={{ color: C.accent }}>
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [twitter, setTwitter] = useState<DataRow[]>([])
  const [youtube, setYoutube] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"twitter" | "youtube">("twitter")
  const [sentFilter, setSentFilter] = useState("all")
  const [valFilter, setValFilter] = useState("all")
  const [emotFilter, setEmotFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const PER = 20

  useEffect(() => {
    loadData().then(({ twitter, youtube }) => {
      setTwitter(twitter)
      setYoutube(youtube)
      setLoading(false)
    })
  }, [])

  const twSent = useMemo(() => getSentimentBreakdown(twitter), [twitter])
  const ytSent = useMemo(() => getSentimentBreakdown(youtube), [youtube])
  const twEmot = useMemo(() => getEmotionBreakdown(twitter), [twitter])
  const ytEmot = useMemo(() => getEmotionBreakdown(youtube), [youtube])
  const twVal = useMemo(() => getValenceBreakdown(twitter), [twitter])
  const ytVal = useMemo(() => getValenceBreakdown(youtube), [youtube])
  const timeline = useMemo(() => getTimelineData(twitter), [twitter])
  const actors = useMemo(() => getActorMentions(twitter), [twitter])
  const framing = useMemo(() => getFramingClusters(twitter), [twitter])
  const acct = useMemo(() => getAccountTypeBreakdown(twitter), [twitter])

  const mkPie = (sent: ReturnType<typeof getSentimentBreakdown>) =>
    Object.entries(sent)
      .filter(([k]) => k !== "netral")
      .map(([k, v]) => ({ name: SENT_LABELS[k], value: v, key: k }))

  const twPie = useMemo(() => mkPie(twSent), [twSent])
  const ytPie = useMemo(() => mkPie(ytSent), [ytSent])
  const allPie = useMemo(() => {
    const c: Record<string, number> = {}
    ;[...twitter, ...youtube].forEach((r) => {
      c[r.sentiment] = (c[r.sentiment] || 0) + 1
    })
    return Object.entries(c)
      .filter(([k]) => k !== "netral")
      .map(([k, v]) => ({ name: SENT_LABELS[k] || k, value: v, key: k }))
  }, [twitter, youtube])

  const valPlatform = useMemo(() => [{ platform: "Twitter", ...twVal }, { platform: "YouTube", ...ytVal }], [twVal, ytVal])
  const emotCombined = useMemo(() => {
    const all = new Set([...twEmot.map((e) => e[0]), ...ytEmot.map((e) => e[0])])
    const tm = Object.fromEntries(twEmot)
    const ym = Object.fromEntries(ytEmot)
    return [...all]
      .map((k) => ({ name: EMOT_LABELS[k] || k, key: k, Twitter: tm[k] || 0, YouTube: ym[k] || 0 }))
      .sort((a, b) => b.Twitter + b.YouTube - (a.Twitter + a.YouTube))
  }, [twEmot, ytEmot])

  const src = tab === "twitter" ? twitter : youtube
  const filtered = useMemo(
    () =>
      src.filter((r) => {
        if (sentFilter !== "all" && r.sentiment !== sentFilter) return false
        if (valFilter !== "all" && r.valence !== valFilter) return false
        if (emotFilter !== "all" && r.emotion !== emotFilter) return false
        if (
          search &&
          !r.text.toLowerCase().includes(search.toLowerCase()) &&
          !r.screen_name.toLowerCase().includes(search.toLowerCase())
        )
          return false
        return true
      }),
    [src, sentFilter, valFilter, emotFilter, search],
  )
  const totalPages = Math.ceil(filtered.length / PER)
  const paginated = filtered.slice((page - 1) * PER, page * PER)
  const filteredSentiment = useMemo(
    () =>
      filtered.reduce(
        (acc, row) => {
          acc[row.sentiment] = (acc[row.sentiment] || 0) + 1
          return acc
        },
        { pro_pandji: 0, anti_pandji: 0, skeptis: 0, netral: 0 } as Record<string, number>,
      ),
    [filtered],
  )

  const exportFilteredCsv = () => {
    const headers = ["platform", "screen_name", "text", "sentiment", "emotion", "valence", "date", "views"]
    const rows = filtered.map((r) => [r.platform, r.screen_name, r.text, r.sentiment, r.emotion, r.valence, r.date, r.views])
    const csv = [headers.map(csvEsc).join(","), ...rows.map((row) => row.map(csvEsc).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mensrea-${tab}-filtered-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setSentFilter("all")
    setValFilter("all")
    setEmotFilter("all")
    setSearch("")
    setPage(1)
  }

  useEffect(() => {
    if (totalPages === 0 && page !== 1) {
      setPage(1)
      return
    }
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: C.accent, borderTopColor: 'transparent' }} />
        <p style={{ color: C.muted, ...F.meta }}>Memuat dataset...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: "'Source Sans 3', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.06]" style={{ background: 'radial-gradient(circle at 15% 10%, rgba(217,174,99,0.2), transparent 38%), radial-gradient(circle at 85% 22%, rgba(96,165,250,0.18), transparent 34%), linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)' }} />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 xl:px-12 py-10 md:py-12 space-y-10">

        {/* HEADER */}
        <div className="rounded-2xl border p-5 md:p-6" style={{ borderColor: C.border, background: `linear-gradient(135deg, rgba(217,174,99,0.18), rgba(23,35,59,0.85) 40%, rgba(96,165,250,0.12))` }}>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase mb-2" style={{ color: C.accentSoft, ...F.caps }}>Dashboard Analitik · S3 Komunikasi Penyiaran Islam</p>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight" style={{ fontFamily: 'Source Serif 4, serif' }}>
                Kontroversi <em style={{ color: C.accent }}>Mens Rea</em>{' '}
                <span className="text-lg md:text-2xl font-normal" style={{ color: '#dce6f8' }}>Pandji Pragiwaksono</span>
              </h1>
              <p className="mt-2 text-base md:text-lg leading-relaxed" style={{ color: '#d4dff2', ...F.meta }}>Polarisasi Sentimen: Kebebasan Berekspresi vs. Penistaan Agama</p>
            </div>
            <div className="text-right space-y-1 rounded-xl border px-4 py-3" style={{ borderColor: '#3b4b70', background: 'rgba(8,14,25,0.42)' }}>
              <p className="font-medium" style={{ color: C.text, ...F.meta }}>Aden Hidayat</p>
              <p className="text-[12px]" style={{ color: C.muted, ...F.meta }}>S3 Komunikasi Penyiaran Islam · 2026</p>
              <div className="flex gap-2 justify-end mt-2">
                <Badge label="Twitter/X" color={C.accent} />
                <Badge label="YouTube iNews" color="#ff6b6b" />
              </div>
              <p className="text-[12px]" style={{ color: C.muted, ...F.meta }}>7 Jan – 20 Feb 2026</p>
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Total Data', val: (twitter.length+youtube.length).toLocaleString(), sub:'Twitter + YouTube' },
            { label:'Tweet Twitter', val: twitter.length.toString(), sub:`${acct.media} media · ${acct.publik} publik` },
            { label:'Komentar YouTube', val: youtube.length.toLocaleString(), sub:'1 video iNews' },
            { label:'Akun Verified', val: twitter.filter(r=>r.is_verified==='True'||r.is_verified==='true').length.toString(), sub:`dari ${twitter.length} tweet` },
          ].map((s,i) => (
            <Card key={i} className="text-center">
              <p className="text-[11px] uppercase mb-2" style={{ color: C.muted, ...F.caps }}>{s.label}</p>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: C.accent, fontFamily:'Source Serif 4, serif' }}>{s.val}</p>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: C.muted, ...F.meta }}>{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* TIMELINE */}
        <Card>
          <Sec>Dinamika Percakapan Twitter</Sec>
          <p className="text-sm mb-4 leading-relaxed" style={{ color: C.muted, ...F.meta }}>Volume tweet harian · Puncak: 9 Jan 2026 (64 tweet - demo di Kantor Komdigi)</p>
          <div className="h-[180px] md:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.3}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize:11, fill:C.muted }} tickFormatter={d=>d.slice(5).replace('-','/')} />
                <YAxis tick={{ fontSize:11, fill:C.muted }} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="count" name="Tweet" stroke={C.accent} strokeWidth={2} fill="url(#tg)" dot={{ r:3, fill:C.accent }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[12px] mt-2 text-right" style={{ color: C.muted, ...F.meta }}>* Timestamp akurat hanya tersedia untuk Twitter</p>
        </Card>

        {/* SENTIMENT PIES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title:'Sentimen Twitter', data:twPie, total:twitter.length },
            { title:'Sentimen YouTube', data:ytPie, total:youtube.length },
            { title:'Gabungan (excl. Netral)', data:allPie, total:twitter.length+youtube.length },
          ].map((p,i) => (
            <Card key={i}>
              <p className="text-base font-semibold mb-3" style={{ color:C.accentSoft, fontFamily:'Source Sans 3, sans-serif' }}>{p.title}</p>
              <div className="h-[170px] md:h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={p.data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" nameKey="name" paddingAngle={3}>
                      {p.data.map((e:any,j:number) => <Cell key={j} fill={SENT_COLORS[e.key]||'#888'} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} (${(((v as number)/p.total)*100).toFixed(1)}%)`,'']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
                {p.data.map((d:any) => <span key={d.key} className="flex items-center gap-1 text-xs" style={{ color:C.muted, fontFamily:'Source Sans 3, sans-serif' }}><span className="w-2 h-2 rounded-full" style={{ background:SENT_COLORS[d.key] }}/>{d.name} ({d.value})</span>)}
              </div>
            </Card>
          ))}
        </div>

        {/* VALENCE */}
        <Card>
          <Sec>Valence (Muatan Emosi) per Platform</Sec>
          <p className="text-sm mb-4" style={{ color:C.muted, ...F.meta }}>Arah muatan emosi: Positive · Negative · Neutral</p>
          <div className="h-[190px] md:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valPlatform} margin={{ left:-10 }}>
                <XAxis dataKey="platform" tick={{ fontSize:12, fill:C.text }} />
                <YAxis tick={{ fontSize:11, fill:C.muted }} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize:12, color:C.muted }} />
                <Bar dataKey="positive" name="Positive" fill={C.pos} radius={[4,4,0,0]} />
                <Bar dataKey="negative" name="Negative" fill={C.neg} radius={[4,4,0,0]} />
                <Bar dataKey="neutral"  name="Neutral"  fill={C.neu} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* EMOTION */}
        <Card>
          <Sec>Distribusi Emosi per Platform</Sec>
          <p className="text-sm mb-4" style={{ color:C.muted, ...F.meta }}>8 kategori emosi berdasarkan analisis teks</p>
          <div className="h-[240px] md:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotCombined} layout="vertical" margin={{ left:20, right:20 }}>
                <XAxis type="number" tick={{ fontSize:11, fill:C.muted }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:C.muted }} width={110} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize:12, color:C.muted }} />
                <Bar dataKey="Twitter" name="Twitter" fill={C.accent} radius={[0,4,4,0]} />
                <Bar dataKey="YouTube" name="YouTube" fill="#ff6b6b" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ACTORS + FRAMING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <Sec>Aktor Paling Banyak Disebut (Twitter)</Sec>
            <div className="h-[230px] md:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actors} layout="vertical" margin={{ left:10, right:20 }}>
                  <XAxis type="number" tick={{ fontSize:11, fill:C.muted }} />
                  <YAxis type="category" dataKey="actor" width={135} tick={{ fontSize:11, fill:C.text }} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="count" name="Sebutan" radius={[0,4,4,0]}>
                    {actors.map((_,i) => <Cell key={i} fill={`hsl(${38+i*12},${70-i*5}%,${55-i*3}%)`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <Sec>Framing & Komposisi Akun Twitter</Sec>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] mb-2" style={{ color:C.muted, ...F.meta }}>Cluster Framing</p>
                <div className="h-[190px] md:h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={framing} layout="vertical" margin={{ left:5, right:10 }}>
                      <XAxis type="number" tick={{ fontSize:10, fill:C.muted }} />
                      <YAxis type="category" dataKey="cluster" width={105} tick={{ fontSize:10, fill:C.text }} />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="count" name="Tweet" fill={C.accent} radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[12px] mt-1" style={{ color:C.muted, ...F.meta }}>* 1 tweet bisa {'>'} 1 cluster</p>
              </div>
              <div>
                <p className="text-[12px] mb-2" style={{ color:C.muted, ...F.meta }}>Tipe Akun</p>
                <div className="h-[190px] md:h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name:'Media/Institusi', value:acct.media },{ name:'Publik/Personal', value:acct.publik }]}
                        cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={4}>
                        <Cell fill={C.accent}/><Cell fill="#60a5fa"/>
                      </Pie>
                      <Tooltip formatter={(v)=>[`${v} akun`,'']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {[{ l:'Media/Institusi', c:C.accent, v:acct.media },{ l:'Publik/Personal', c:'#60a5fa', v:acct.publik }].map(x=>(
                    <span key={x.l} className="flex items-center gap-1 text-[12px]" style={{ color:C.muted, ...F.meta }}><span className="w-2 h-2 rounded-full" style={{ background:x.c }}/>{x.l} ({x.v})</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* DATA TABLE */}
        <Card>
          <Sec>Jelajahi Data</Sec>
          <div className="flex gap-1 mb-4 p-1 rounded-lg w-fit border" style={{ background:C.bgSoft, borderColor: C.border }}>
            {(['twitter','youtube'] as const).map(t=>(
              <button key={t} onClick={()=>{ setTab(t); setPage(1) }} className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                style={{ background: tab===t ? C.accent : 'transparent', color: tab===t ? C.bg : C.muted }}>
                {t==='twitter'?`Twitter (${twitter.length})`:`YouTube (${youtube.length})`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1) }} placeholder="Cari teks atau akun..."
              className="px-3 py-2 rounded-lg text-sm flex-1 min-w-[190px]"
              style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.text }} />
            {[
              { v:sentFilter, fn:(x:string)=>{ setSentFilter(x); setPage(1) }, opts:[['all','Semua Sentimen'],['pro_pandji','Pro-Pandji'],['anti_pandji','Anti-Pandji'],['skeptis','Skeptis'],['netral','Netral']] },
              { v:valFilter,  fn:(x:string)=>{ setValFilter(x); setPage(1) },  opts:[['all','Semua Valence'],['positive','Positive'],['negative','Negative'],['neutral','Neutral']] },
              { v:emotFilter, fn:(x:string)=>{ setEmotFilter(x); setPage(1) }, opts:[['all','Semua Emosi'],['kemarahan','Kemarahan'],['penghinaan','Penghinaan'],['kekhawatiran','Kekhawatiran'],['dukungan','Dukungan'],['ejekan_ironi','Ejekan/Ironi'],['kekecewaan','Kekecewaan'],['kelegaan','Kelegaan'],['informatif','Informatif']] },
            ].map((f,i)=>(
              <select key={i} value={f.v} onChange={e=>f.fn(e.target.value)} className="px-3 py-2 rounded-lg text-sm"
                style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.text }}>
                {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            ))}
            <button onClick={reset} className="px-3 py-2 rounded-lg text-sm" style={{ background:C.border, color:C.text }}>Reset</button>
            <button onClick={exportFilteredCsv} className="px-3 py-2 rounded-lg text-sm" style={{ background:C.accent, color:C.bg, fontWeight:600 }}>Export CSV</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {([
              { key: "pro_pandji", label: "Pro-Pandji" },
              { key: "anti_pandji", label: "Anti-Pandji" },
              { key: "skeptis", label: "Skeptis" },
              { key: "netral", label: "Netral" },
            ] as const).map((item) => (
              <div key={item.key} className="rounded-lg border px-3 py-2" style={{ borderColor: C.border, background: C.bg }}>
                <p className="text-[11px] uppercase" style={{ color: C.muted, ...F.caps }}>{item.label}</p>
                <p className="text-lg font-semibold" style={{ color: SENT_COLORS[item.key], fontFamily: 'Source Sans 3, sans-serif' }}>{filteredSentiment[item.key]}</p>
              </div>
            ))}
          </div>
          <p className="text-sm mb-3" style={{ color:C.muted, ...F.meta }}>
            Menampilkan {Math.min((page-1)*PER+1, filtered.length)}–{Math.min(page*PER, filtered.length)} dari {filtered.length} data
          </p>
          <div className="overflow-auto rounded-lg max-h-[560px]" style={{ border:`1px solid ${C.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background:'rgba(11,18,32,0.95)', borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:10, backdropFilter:'blur(6px)' }}>
                  {['Akun','Konten','Sentimen','Emosi','Valence', tab==='twitter'?'Views':'Votes'].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] uppercase" style={{ color:C.muted, ...F.caps }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((r,i)=>{
                  const sentimentStripe = r.sentiment==='pro_pandji' ? C.pro : r.sentiment==='anti_pandji' ? C.anti : r.sentiment==='skeptis' ? C.skeptis : C.neu
                  return (
                  <tr key={i} className="border-b transition-colors hover:bg-white/10" style={{ borderColor:C.border,
                    background: i % 2 === 0 ? 'rgba(15,23,42,0.45)' : 'transparent', boxShadow: `inset 3px 0 0 ${sentimentStripe}` }}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-[12px]" style={{ color:C.text, ...F.meta }}>@{r.screen_name}</span>
                        {r.account_type==='media' && <Badge label="Media" color={C.accent} />}
                        {r.date && <span className="text-[12px]" style={{ color:C.muted, ...F.meta }}>{r.date.slice(0,10)}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <p className="text-[12px] leading-relaxed line-clamp-3" style={{ color:C.text, ...F.meta }}>{r.text}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge label={SENT_LABELS[r.sentiment]||r.sentiment} color={SENT_COLORS[r.sentiment]||C.muted} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.emotion && r.emotion!=='tidak_terdeteksi' && r.emotion!=='informatif' && (
                        <Badge label={EMOT_LABELS[r.emotion]||r.emotion} color={EMOT_COLORS[r.emotion]||C.muted} />
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge label={r.valence} color={r.valence==='positive'?C.pos:r.valence==='negative'?C.neg:C.neu} />
                    </td>
                    <td className="px-3 py-2 text-[12px] text-right" style={{ color:C.muted, ...F.meta }}>
                      {r.views ? fmt(parseInt(r.views)||0) : '—'}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-2 rounded-lg text-sm disabled:opacity-30" style={{ background:C.border, color:C.text, fontFamily: 'Source Sans 3, sans-serif' }}>← Prev</button>
            <span className="text-[12px]" style={{ color:C.muted, ...F.meta }}>Hal {page} / {totalPages || 1}</span>
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages||totalPages===0} className="px-3 py-2 rounded-lg text-sm disabled:opacity-30" style={{ background:C.border, color:C.text, fontFamily: 'Source Sans 3, sans-serif' }}>Next →</button>
          </div>
        </Card>

        {/* METHODOLOGY */}
        <Card>
          <Sec>Catatan Metodologis</Sec>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { title:'📊 Sumber Data & Pipeline', items:['Twitter/X: 129 tweet via Apify Advanced Search · "pandji" + "mens rea" + "NU/muhammadiyah" · Jan–Feb 2026','YouTube: 1.466 komentar dari video iNews "FULL Mens Rea Pandji Jadi Api Polemik" via Apify YouTube Scraper'] },
              { title:'🏷️ Metode Labeling', items:['Sentiment (4 label): Pro-Pandji, Anti-Pandji, Skeptis Pelapor, Netral — rule-based keyword classification','Emotion (8 label): kemarahan, penghinaan, kekhawatiran, dukungan, ejekan/ironi, kekecewaan, kelegaan, informatif','Valence: positive / negative / neutral — diturunkan dari label emosi'] },
              { title:'⚠️ Keterbatasan', items:['Volume Twitter terbatas (129 tweet) — tidak representatif secara statistik','Timestamp YouTube hanya relatif ("4 days ago") — tidak bisa dibuat timeline akurat','YouTube hanya dari 1 sumber (iNews) — bias framing debat panel','Rule-based labeling rentan terhadap sarkasme dan konteks implisit bahasa Indonesia'] },
              { title:'🔬 Validasi Manual', items:['Sampel validasi: 20 tweet Twitter + 20 komentar YouTube (file: validation_sample.csv)','Akurasi = (label cocok / 40) × 100% — diisi setelah validasi manual','3 dimensi validasi: sentiment, emotion, valence'] },
            ].map((b,i)=>(
              <div key={i} className="rounded-lg p-4" style={{ background:C.bg, border:`1px solid ${C.border}` }}>
                <p className="text-base font-semibold mb-2" style={{ color:C.accent }}>{b.title}</p>
                <ul className="space-y-1.5">{b.items.map((item,j)=><li key={j} className="flex gap-2 text-sm leading-relaxed" style={{ color:C.muted, ...F.meta }}><span style={{ color:C.accent, flexShrink:0 }}>·</span>{item}</li>)}</ul>
              </div>
            ))}
          </div>
        </Card>

        {/* FOOTER */}
        <div className="text-center py-4 border-t" style={{ borderColor:C.border }}>
          <p className="text-[12px]" style={{ color:C.muted, ...F.meta }}>Dashboard Analitik Mens Rea · Aden Hidayat · S3 Komunikasi Penyiaran Islam · 2026</p>
          <p className="text-[12px] mt-1 italic" style={{ color:'#7f91b3', ...F.meta }}>"AI mempercepat produksi; integritas ilmiah tetap milik peneliti."</p>
        </div>

      </div>
    </div>
  )
}
