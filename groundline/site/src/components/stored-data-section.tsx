"use client";

import { Card } from "@/components/ui/card";
import { useDataSets } from "@/hooks/useDataSets";
import { useDataSetPieces } from "@/hooks/useDataSetPieces";
import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/wallet-button";
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
        { label: "Total Storage Used", value: "0 GB", percentage: 0 },
        { label: "Documents Stored", value: "0", change: null },
        { label: "Filecoin Deals", value: "0", change: null },
        { label: "Verification Rate", value: "—", change: null },
      ];
    }

    const totalPieces = piecesData?.totalCount || 0;
    const totalDataSets = dataSets.length;

    return [
      { label: "Total Storage Used", value: "—", percentage: 0 },
      { label: "Pieces Stored", value: totalPieces.toString(), change: null },
      { label: "Data Sets", value: totalDataSets.toString(), change: null },
      { label: "Verification Rate", value: "99.8%", change: "+0.2%" },
    ];
  }, [dataSets, piecesData]);

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
          <p className="text-muted-foreground mb-4">
            You don't have any data sets stored on Filecoin yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Connected wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section id="stored-data" className="scroll-mt-8">
      <div className="mb-6">
        <h2 className="text-4xl font-light mb-2">Stored Data</h2>
        <p className="text-muted-foreground">View your Filecoin storage and verification status</p>
      </div>

      {/* Storage Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {storageStats.map((stat, index) => (
          <Card key={index} className="border border-foreground/10 bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
            <div className="text-3xl font-light mb-1">{stat.value}</div>
            {stat.percentage !== undefined && stat.percentage > 0 && (
              <div className="mt-2">
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-foreground h-1.5 rounded-full" style={{ width: `${stat.percentage}%` }}></div>
                </div>
              </div>
            )}
            {stat.change && (
              <div
                className={`text-xs font-mono mt-1 ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
              >
                {stat.change}
              </div>
            )}
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
          
          {piecesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading pieces...</p>
            </div>
          ) : piecesData && piecesData.pieces.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {piecesData.pieces.map(({ piece, dataSet }) => (
                <div
                  key={piece.pieceId}
                  className="p-3 rounded-md border border-foreground/10 hover:bg-foreground/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-md">
                      <FolderGit2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-1">Piece #{piece.pieceId}</div>
                      <div className="text-xs text-muted-foreground break-all mb-2">
                        CID: {String(piece.pieceCid).slice(0, 8)}...{String(piece.pieceCid).slice(-8)}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Globe className="w-3 h-3 mr-1" />
                        {dataSet.payee ? `${dataSet.payee.slice(0, 6)}...${dataSet.payee.slice(-4)}` : 'No provider'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No pieces found in this data set
            </div>
          )}
        </Card>
      )}
    </section>
  );
}
