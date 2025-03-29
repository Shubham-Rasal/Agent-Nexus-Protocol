import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "AI Network Platform",
  description: "A platform for AI agents and networks",
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
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="font-bold text-xl">ANP</div>
              <div className="space-x-6">
                <Link 
                  href="/" 
                  className="hover:text-blue-600 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/agents" 
                  className="hover:text-blue-600 transition-colors"
                >
                  Agents Directory
                </Link>
                <Link 
                  href="/network" 
                  className="hover:text-blue-600 transition-colors"
                >
                  Agent Network
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
