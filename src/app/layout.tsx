import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { SITE, repoUrl } from "@/config/site";
import { Logo } from "@/components/Logo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: SITE.name,
  description: "Search about 15,000 popular skills for Claude Code, grouped by category, each linking to its GitHub source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasRepo = Boolean(SITE.repo.owner && SITE.repo.name);
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen">
        <header className="h-16 border-b border-line">
          <div className="mx-auto flex h-full max-w-[900px] items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 rounded">
              <Logo />
              <span className="font-serif text-lg font-semibold">{SITE.name}</span>
            </Link>
            {hasRepo && (
              <a
                href={repoUrl}
                className="rounded text-sm text-muted hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-[900px] px-4 pb-24 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
