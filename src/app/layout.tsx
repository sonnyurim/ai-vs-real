import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RankingPanel } from "@/components/ranking/ranking-sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real or AI? - 연암공과대학교",
  description:
    "AI가 만든 이미지 vs 진짜 사진, 당신은 구별할 수 있나요? 연암공과대학교 AI 감별 퀴즈 게임",
  openGraph: {
    title: "Real or AI? - 연암공과대학교",
    description: "AI가 만든 이미지 vs 진짜 사진, 당신은 구별할 수 있나요?",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <main className="min-h-dvh">{children}</main>
        <RankingPanel />
      </body>
    </html>
  );
}
