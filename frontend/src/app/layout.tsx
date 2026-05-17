import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANP - AI Network Protocol",
  description:
    "AI Network Protocol (ANP) - A decentralized platform for AI agents, MCP servers, and intelligent network interactions.",
  keywords:
    "AI Network Protocol, ANP, artificial intelligence, AI agents, MCP servers, blockchain, decentralized AI",
  authors: [{ name: "ANP Team" }],
  openGraph: {
    title: "ANP - AI Network Protocol",
    description:
      "A decentralized platform for AI agents, MCP servers, and intelligent network interactions.",
    type: "website",
    siteName: "ANP",
  },
  twitter: {
    card: "summary_large_image",
    title: "ANP - AI Network Protocol",
    description:
      "A decentralized platform for AI agents, MCP servers, and intelligent network interactions.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <main className="flex flex-col min-h-screen">
            <Navbar />
            {children}
            <Toaster richColors />
          </main>
        </Providers>
      </body>
    </html>
  );
}
