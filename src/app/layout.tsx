import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FIND THE AI — 연암공과대학교",
  description:
    "실제 사진 속에 AI가 몰래 넣은 사물을 찾아라! 연암공과대학교 AI 감별 퀴즈 게임",
  openGraph: {
    title: "FIND THE AI — 연암공과대학교",
    description: "실제 사진 속에 AI가 몰래 넣은 사물을 찾아라!",
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
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <main className="min-h-dvh">{children}</main>
      </body>
    </html>
  );
}
