"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WagmiProvider } from "wagmi";
import { filecoin, filecoinCalibration } from "wagmi/chains";
import { http, createConfig } from "@wagmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const queryClient = new QueryClient();

const config = createConfig({
  chains: [filecoinCalibration, filecoin],
  connectors: [],
  transports: {
    [filecoin.id]: http(),
    [filecoinCalibration.id]: http(),
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>ANP - AI Network Protocol</title>
        <meta
          name="description"
          content="AI Network Protocol (ANP) - A decentralized platform for AI agents, MCP servers, and intelligent network interactions. Build, deploy, and manage AI agents with blockchain integration."
        />
        <meta
          name="keywords"
          content="AI Network Protocol, ANP, artificial intelligence, AI agents, MCP servers, blockchain, decentralized AI, machine learning, AI tools, knowledge graph, network automation"
        />
        <meta name="author" content="ANP Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="ANP - AI Network Protocol" />
        <meta property="og:description" content="A decentralized platform for AI agents, MCP servers, and intelligent network interactions." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ANP" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ANP - AI Network Protocol" />
        <meta name="twitter:description" content="A decentralized platform for AI agents, MCP servers, and intelligent network interactions." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={config}>
              <RainbowKitProvider
                modalSize="compact"
                initialChain={filecoinCalibration.id}
              >
                <main className="flex flex-col min-h-screen">
                  <Navbar />
                  {children}
                  <Toaster richColors />
                </main>
                <Footer />
              </RainbowKitProvider>
            </WagmiProvider>
          </QueryClientProvider>
      </body>
    </html>
  );
}
