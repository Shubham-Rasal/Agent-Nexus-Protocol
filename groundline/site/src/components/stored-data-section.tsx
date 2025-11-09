"use client";

import { Card } from "@/components/ui/card";
import { useDataSets } from "@/hooks/useDataSets";
import { useDataSetPieces } from "@/hooks/useDataSetPieces";
import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/wallet-button";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import { PiecesGrid } from "@/components/PiecesGrid";
import { Shield, FolderGit2, Globe, Cloud, Loader2 } from "lucide-react";
import { EnhancedDataSetInfo } from "@filoz/synapse-sdk";

export function StoredDataSection() {
  const { address, isConnected } = useAccount();
  const { data: dataSets, isLoading: dataSetsLoading, error: dataSetsError } = useDataSets();
  const [selectedDataSetId, setSelectedDataSetId] = useState<number | null>(null);
  const { data: piecesData, isLoading: piecesLoading } = useDataSetPieces(selectedDataSetId);

  // Calculate storage stats from datasets
  const storageStats = useMemo(() => {
    if (!dataSets || dataSets.length === 0) {
      return [
        { label: "Documents Stored", value: "0", change: null },
      ];
    }

    return [
      { label: "Data Sets", value: dataSets.length.toString(), change: null },
    ];
  }, [dataSets]);

  // Not connected state
  if (!isConnected) {
    return (
      <section id="stored-data" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-4xl font-light mb-2">Stored Data</h2>
          <p className="text-muted-foreground">View your Filecoin storage and verification status</p>
        </div>

        <Card className="border border-foreground/10 bg-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">💾</div>
            <h3 className="text-2xl font-light mb-4">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-8">
              Connect your wallet to view your stored data sets and pieces on Filecoin.
            </p>
            <WalletButton />
          </div>
        </Card>
      </section>
    );
  }

  // Loading state
  if (dataSetsLoading) {
    return (
      <section id="stored-data" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-4xl font-light mb-2">Stored Data</h2>
          <p className="text-muted-foreground">View your Filecoin storage and verification status</p>
        </div>

        <Card className="border border-foreground/10 bg-card p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your data sets...</p>
        </Card>
      </section>
    );
  }

  // Error state
  if (dataSetsError) {
    return (
      <section id="stored-data" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-4xl font-light mb-2">Stored Data</h2>
          <p className="text-muted-foreground">View your Filecoin storage and verification status</p>
        </div>

        <Card className="border border-red-500/20 bg-card p-12 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-light mb-4">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{dataSetsError.message}</p>
          <p className="text-muted-foreground text-sm">
            Please make sure you're connected to the Filecoin Calibration network.
          </p>
        </Card>
      </section>
    );
  }

  // No datasets state
  if (!dataSets || dataSets.length === 0) {
    return (
      <section id="stored-data" className="scroll-mt-8">
        <div className="mb-6">
          <h2 className="text-4xl font-light mb-2">Stored Data</h2>
          <p className="text-muted-foreground">View your Filecoin storage and verification status</p>
        </div>

        <Card className="border border-foreground/10 bg-card p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-light mb-4">No Data Sets Found</h3>
          <p className="text-muted-foreground mb-6">
            You don't have any data sets stored on Filecoin yet.
          </p>
          <div className="mb-4">
            <FileUploadDialog />
          </div>
          <p className="text-sm text-muted-foreground">
            Connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section id="stored-data" className="scroll-mt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-light mb-2">Stored Data</h2>
          <p className="text-muted-foreground">View your Filecoin storage and verification status</p>
        </div>
        <FileUploadDialog />
      </div>

      {/* Storage Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {storageStats.map((stat, index) => (
          <Card key={index} className="border border-foreground/10 bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
            <div className="text-3xl font-light mb-1">{stat.value}</div>
            
          </Card>
        ))}
      </div>

      {/* Data Sets List */}
      <Card className="border border-foreground/10 bg-card p-6 mb-6">
        <h3 className="text-xl font-light mb-4">Your Data Sets</h3>
        <div className="space-y-3">
          {dataSets.map((dataSet: EnhancedDataSetInfo) => (
            <div
              key={dataSet.pdpVerifierDataSetId}
              className="flex items-center justify-between py-3 border-b border-foreground/5 last:border-0 cursor-pointer hover:bg-foreground/5 px-3 rounded transition-colors"
              onClick={() => setSelectedDataSetId(dataSet.pdpVerifierDataSetId)}
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-md">
                  <Shield className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">Data Set #{dataSet.pdpVerifierDataSetId}</span>
                    {selectedDataSetId === dataSet.pdpVerifierDataSetId && (
                      <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">Selected</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Provider: {dataSet.serviceProvider || "Unknown"}
                  </div>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">→</button>
            </div>
          ))}
        </div>
      </Card>

      {/* Pieces Grid */}
      {selectedDataSetId && (
        <Card className="border border-foreground/10 bg-card p-6">
          <h3 className="text-xl font-light mb-4">
            Pieces from Data Set #{selectedDataSetId}
          </h3>
          
          <PiecesGrid
            pieces={piecesData?.pieces || []}
            isLoading={piecesLoading}
            error={piecesData ? null : new Error("Failed to load pieces")}
            dataSetId={selectedDataSetId}
          />
        </Card>
      )}
    </section>
  );
}
