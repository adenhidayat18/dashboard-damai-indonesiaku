# 📊 Damai Indonesiaku — Research Dashboard

> Dashboard analitik berbasis AI untuk riset mediatisasi agama dan politik identitas dalam program Damai Indonesiaku TVOne/YouTube.

---

## 🎓 Konteks Riset

**Judul:**
> *"Mediatisasi Agama dan Politik Identitas dalam Legitimasi Islam Moderat — Studi Kasus Mediamorfosis TVOne ke YouTube pada Program Damai Indonesiaku di Era Neo-Fordisme"*

**Pertanyaan Riset:**
> Bagaimana respons audiens YouTube terhadap konstruksi narasi Islam moderat dalam program Damai Indonesiaku TVOne?

**Kerangka Teori:**
- Mediatisasi Agama (Hjarvard, 2008)
- Mediamorfosis (Fidler, 1997)
- Politik Identitas & Framing Islam Moderat
- Ekonomi Politik Media (Neo-Fordisme)

---

## 🚀 Fitur Dashboard

| Fitur | Deskripsi |
|-------|-----------|
| **Upload CSV** | Import komentar YouTube dalam format CSV |
| **Analisis AI** | Sentimen, narrative frame, dan keywords dengan Claude |
| **Distribusi Sentimen** | Pie chart positif/negatif/netral/ambigu |
| **Narrative Frames** | Bar chart bingkai narasi (Islam moderat, toleransi, dll.) |
| **Time Series** | Tren sentimen dari waktu ke waktu |
| **Keyword Cloud** | Peta kata kunci berbobot sentimen |
| **Tabel Komentar** | Filter, cari, dan eksplorasi komentar |
| **Mode Sentiment** | Toggle `Sentiment AI` atau `Sentiment API` |
| **Filter KOL & Source Sentiment** | Filter dashboard berdasarkan KOL dan sentimen sumber |

---

## 🗂 Struktur Proyek

```
damai-indonesiaku-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/
│   │   │       └── route.ts        # API endpoint analisis AI
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Halaman dashboard utama
│   │   ├── globals.css             # Design system & variabel CSS
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── charts/
│   │   │   ├── SentimentChart.tsx  # Pie chart distribusi sentimen
│   │   │   ├── NarrativeFrameChart.tsx # Bar chart narrative frames
│   │   │   ├── TimeSeriesChart.tsx # Area chart tren waktu
│   │   │   └── KeywordCloud.tsx    # Word cloud keyword
│   │   ├── CSVUploader.tsx         # Komponen upload & parse CSV
│   │   ├── StatsOverview.tsx       # Kartu statistik ringkasan
│   │   └── CommentsTable.tsx       # Tabel komentar dengan filter
│   ├── lib/
│   │   ├── anthropic.ts            # Service analisis AI (server)
│   │   └── utils.ts                # Utility functions
│   └── types/
│       └── index.ts                # TypeScript type definitions
├── public/
├── .env.example                    # Template environment variables
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## ⚙️ Instalasi & Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd damai-indonesiaku-dashboard
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` dan isi nilai-nilainya:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

Dapatkan API key Anthropic di: [console.anthropic.com](https://console.anthropic.com)

### 3. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### Shortcut Windows

Jika project dijalankan di Windows, gunakan file `start-project.bat` di root project.

- Double-click `start-project.bat`, atau
- Jalankan dari Command Prompt:

```bat
start-project.bat
```

Script ini akan:
- mengecek `npm`
- menjalankan `npm install` bila `node_modules` belum ada
- membuat `.env.local` dari `.env.example` bila belum ada
- menjalankan `npm run dev`

Untuk PowerShell, gunakan file `start-project.ps1`:

```powershell
./start-project.ps1
```

Jika PowerShell memblokir eksekusi script, jalankan:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
./start-project.ps1
```

### 4. Build untuk Produksi

```bash
npm run build
npm start
```

---

## 📁 Format CSV Input

File CSV harus memiliki minimal kolom `text` (teks komentar). Kolom lain bersifat opsional.

### Kolom yang Dikenali

| Nama Kolom | Alias | Tipe | Wajib |
|------------|-------|------|-------|
| `text` | `comment`, `comment_text`, `komentar` | string | ✅ |
| `id` | `comment_id` | string | — |
| `author` | `author_name`, `username` | string | — |
| `video_id` | `videoid`, dari `pageUrl` YouTube (`?v=`) | string | — |
| `video_title` | `judul`, `title` | string | — |
| `video_description` | `description`, `deskripsi`, `deskripsi_video` | string | — |
| `published_at` | `date`, `tanggal`, `publishedTimeText` | ISO date / text tanggal | — |
| `likes` | `like_count`, `voteCount` | number | — |
| `reply_count` | `replyCount` | number | — |
| `is_reply` | — | boolean | — |
| `parent_id` | — | string | — |
| `sentiment` | `sentiment_label`, `label_sentiment` | string | — |
| `kol` | `k_o_l` | string | — |
| `has_creator_heart` | `hasCreatorHeart` | boolean | — |
| `author_is_channel_owner` | `authorIsChannelOwner` | boolean | — |

### Contoh CSV

```csv
id,video_id,video_title,author,text,likes,published_at
c001,dQw4w9WgXcQ,Damai Indonesiaku Eps 1,Budi Santoso,"Alhamdulillah program yang sangat bermanfaat dan mencerahkan",45,2024-03-15T08:30:00Z
c002,dQw4w9WgXcQ,Damai Indonesiaku Eps 1,Siti Rahayu,"Islam itu memang agama rahmatan lil alamin, bukan agama kekerasan",23,2024-03-15T09:15:00Z
```

> **Batas:** Maksimum 500 komentar per analisis (biaya API). Untuk dataset lebih besar, bagi menjadi beberapa batch.

---

## 🤖 Kategori Analisis AI

### Sentimen
| Label | Deskripsi |
|-------|-----------|
| `positif` | Respons mendukung, apresiatif |
| `negatif` | Respons menolak, kritis, kontra |
| `netral` | Informatif, tidak memihak |
| `ambigu` | Campuran atau tidak jelas |

### Narrative Frames
| Frame | Deskripsi Riset |
|-------|-----------------|
| `islam_moderat` | Penerimaan/penolakan narasi Islam wasatiyah |
| `nasionalisme_religius` | Perpaduan nasionalisme & keislaman |
| `toleransi` | Wacana toleransi antaragama/antaretnis |
| `anti_radikalisme` | Respons terhadap isu radikalisme |
| `identitas_politik` | Islam sebagai identitas politik |
| `kritik_media` | Kritik framing media, bias, propaganda |
| `lainnya` | Di luar kategori di atas |

---

## 🛠 Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Next.js | 15 | Framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Styling |
| Recharts | 2 | Visualisasi data |
| Anthropic SDK | 0.39 | Analisis AI |
| PapaParse | 5 | Parse CSV |

---

## 📊 Panduan Pengumpulan Data

### Menggunakan YouTube Data API

```python
# Contoh script Python untuk scraping komentar
import googleapiclient.discovery
import pandas as pd

api_key = "YOUR_YOUTUBE_API_KEY"
youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=api_key)

def get_comments(video_id, max_results=100):
    comments = []
    response = youtube.commentThreads().list(
        part="snippet",
        videoId=video_id,
        maxResults=min(max_results, 100),
        textFormat="plainText"
    ).execute()
    
    for item in response["items"]:
        snippet = item["snippet"]["topLevelComment"]["snippet"]
        comments.append({
            "id": item["id"],
            "video_id": video_id,
            "author": snippet["authorDisplayName"],
            "text": snippet["textDisplay"],
            "likes": snippet["likeCount"],
            "published_at": snippet["publishedAt"],
            "reply_count": item["snippet"]["totalReplyCount"]
        })
    return comments

# Ganti dengan Video ID Damai Indonesiaku
video_ids = ["VIDEO_ID_1", "VIDEO_ID_2"]
all_comments = []
for vid in video_ids:
    all_comments.extend(get_comments(vid))

pd.DataFrame(all_comments).to_csv("damai_indonesiaku_comments.csv", index=False)
```

---

## 📝 Catatan Etika Riset

- Data komentar bersifat publik, namun tetap perhatikan privasi pengguna
- Anonimkan data jika diperlukan sebelum publikasi
- Patuhi kebijakan penggunaan data YouTube
- Simpan API key dengan aman, jangan di-commit ke repository

---

## 📚 Referensi Teori

- Hjarvard, S. (2008). *The Mediatization of Religion*. Northern Lights.
- Fidler, R. (1997). *Mediamorphosis: Understanding New Media*. Pine Forge Press.
- Habermas, J. (1984). *The Theory of Communicative Action*. Beacon Press.
- Anderson, B. (1983). *Imagined Communities*. Verso.

---

## 🤝 Kontribusi

Proyek ini bagian dari riset tesis/disertasi. Untuk pertanyaan metodologi atau teknis, buka *Issue* di repository ini.

---

*Dibuat untuk keperluan riset akademik — Program Studi Komunikasi/Media Studies*
