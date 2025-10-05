"use client";

import { ConnectKitButton } from "connectkit";

export function WalletButton() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <button
            onClick={show}
            className="px-4 py-2 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity rounded"
          >
            {isConnected ? ensName ?? truncatedAddress : "Connect Wallet"}
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
}

