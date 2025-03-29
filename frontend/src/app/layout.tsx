import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Home, Users, Network, MessageSquare } from "lucide-react";
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
        <div className="flex h-screen bg-gray-50">
          {/* Left sidebar navigation */}
          <nav className="w-16 bg-white shadow-sm h-full fixed left-0 top-0 flex flex-col items-center py-6 border-r border-gray-200 z-10">
            <div className="font-bold text-xl mb-10">ANP</div>
            <div className="flex flex-col space-y-8">
              <Link 
                href="/" 
                className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors group relative"
                title="Home"
              >
                <Home className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </Link>
              <Link 
                href="/agents" 
                className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors group relative"
                title="Agents Directory"
              >
                <Users className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </Link>
              <Link 
                href="/network" 
                className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors group relative"
                title="Agent Network"
              >
                <Network className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </Link>
              <Link 
                href="/chat" 
                className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors group relative"
                title="Multi-Agent Chat"
              >
                <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </Link>
            </div>
          </nav>
          
          {/* Main content area */}
          <main className="pl-16 w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
