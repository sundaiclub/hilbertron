import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Hilbertron | Mathematical Theorem Prover",
  description: "Automated theorem proving system for mathematical proofs with multiple proof approaches",
  keywords: ["mathematics", "theorem prover", "proofs", "logic", "automated reasoning"],
  authors: [{ name: "Sundai Club" }],
  creator: "Sundai Club",
  publisher: "Sundai Club",
  openGraph: {
    title: "Hilbertron | Mathematical Theorem Prover",
    description: "Automated theorem proving system for mathematical proofs with multiple proof approaches",
    url: "https://sundai.club",
    siteName: "Hilbertron",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hilbertron | Mathematical Theorem Prover",
    description: "Automated theorem proving system for mathematical proofs with multiple proof approaches",
    creator: "@sundaiclub",
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
