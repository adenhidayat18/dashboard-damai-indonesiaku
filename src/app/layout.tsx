import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Damai Indonesiaku Research Dashboard",
  description:
    "Dashboard Analitik Riset Mediatisasi Agama dan Politik Identitas — Program Damai Indonesiaku TVOne/YouTube",
  keywords: [
    "mediatisasi agama",
    "islam moderat",
    "damai indonesiaku",
    "TVOne",
    "youtube analytics",
    "riset komunikasi",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
