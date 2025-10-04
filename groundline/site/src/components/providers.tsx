"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { filecoin, filecoinCalibration } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const queryClient = new QueryClient();

const config = createConfig(
  getDefaultConfig({
    chains: [filecoinCalibration, filecoin],
    transports: {
      [filecoin.id]: http(),
      [filecoinCalibration.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    appName: "Groundline",
    appDescription: "Your personal knowledge graph on Filecoin",
    appUrl: "https://groundline.io",
    appIcon: "https://groundline.io/icon.png",
  })
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

