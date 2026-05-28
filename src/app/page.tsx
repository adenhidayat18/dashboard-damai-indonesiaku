import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Decorative ring */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-indigo-500/10 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-indigo-500/10 pointer-events-none"
      />

      <div className="relative z-10 max-w-2xl text-center space-y-6 animate-fade-in">
        {/* Kaligrafi / ornamen */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--color-gold)]" />
          <span className="text-[var(--color-gold)] text-sm font-medium tracking-widest uppercase">
            Riset Komunikasi
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--color-gold)]" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[var(--color-text)]">
          Damai Indonesiaku
          <br />
          <span className="text-[var(--color-accent)]">Research Dashboard</span>
        </h1>

        <p className="text-[var(--color-text-muted)] text-base leading-relaxed max-w-xl mx-auto">
          Analitik berbasis AI untuk riset{" "}
          <em className="text-[var(--color-text)] not-italic font-medium">
            mediatisasi agama dan politik identitas
          </em>{" "}
          dalam program Damai Indonesiaku TVOne — mediamorfosis ke YouTube di era
          neo-Fordisme.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/dashboard" className="btn-primary text-center py-3 px-6">
            Buka Dashboard →
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-center py-3 px-6"
          >
            Dokumentasi
          </a>
        </div>

        {/* Research context */}
        <div className="mt-10 card text-left space-y-3">
          <p className="stat-label">Topik Riset</p>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            <span className="text-[var(--color-text)] font-medium">
              &ldquo;Mediatisasi Agama dan Politik Identitas dalam Legitimasi
              Islam Moderat — Studi Kasus Mediamorfosis TVOne ke YouTube pada
              Program Damai Indonesiaku di Era Neo-Fordisme&rdquo;
            </span>
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              "Sentimen Audiens",
              "Framing Narasi",
              "Politik Identitas",
              "Islam Moderat",
              "Mediamorfosis",
            ].map((tag) => (
              <span
                key={tag}
                className="badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
