import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Lamla.ai — AI-Powered Learning",
    template: "%s | Lamla.ai",
  },
  description:
    "AI Tutor, Quiz generation, Flashcards, and Study Materials — all in one place. Study smarter with Lamla.ai.",
  keywords: ["AI tutor", "quiz generator", "flashcards", "study materials", "learning"],
  authors: [{ name: "Lamla.ai" }],
  creator: "Lamla.ai",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://lamla.ai"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Lamla.ai — AI-Powered Learning",
    description:
      "AI Tutor, Quiz generation, Flashcards, and Study Materials — all in one place.",
    siteName: "Lamla.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lamla.ai — AI-Powered Learning",
    description:
      "AI Tutor, Quiz generation, Flashcards, and Study Materials — all in one place.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
