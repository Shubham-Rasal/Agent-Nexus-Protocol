"use client";

import { WagmiProvider } from "wagmi";
import { filecoin, filecoinCalibration, baseSepolia } from "wagmi/chains";
import { http } from "@wagmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "Agent Nexus Protocol",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "00000000000000000000000000000000",
  chains: [baseSepolia, filecoinCalibration, filecoin],
  transports: {
    [baseSepolia.id]: http(),
    [filecoin.id]: http(),
    [filecoinCalibration.id]: http(),
  },
  ssr: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider modalSize="compact" initialChain={baseSepolia.id}>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
