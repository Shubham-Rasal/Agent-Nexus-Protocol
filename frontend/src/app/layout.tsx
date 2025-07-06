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
        <title>Fil services demo</title>
        <meta
          name="description"
          content="Demo dApp Powered by synapse-sdk. Upload files to Filecoin with USDFC."
        />
        <meta
          name="keywords"
          content="Filecoin, Demo, synapse-sdk, pdp, upload, filecoin, usdfc"
        />
        <meta name="author" content="FIL-Builders" />
        <meta name="viewport" content="width=device-width, initial-scale=0.6" />
        <link rel="icon" href="/filecoin.svg" />
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
