"use client";

import { useState, useMemo } from "react";
import { FolderGit2, Globe, Loader2, ExternalLink, Copy } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {useAccount} from "wagmi";
interface Piece {
  pieceId: string;
  pieceCid: string;
  timestamp: string;
}

interface DataSet {
  pdpVerifierDataSetId: number;
  payee: string;
  details: any;
  serviceURL: string | null;
  provider: any;
}

interface PiecesGridProps {
  pieces: Array<{
    piece: Piece;
    dataSet: DataSet;
  }>;
  isLoading: boolean;
  error?: Error | null;
  searchTerm?: string;
  dataSetId?: number;
}

export function PiecesGrid({ pieces, isLoading, error, searchTerm = "", dataSetId }: PiecesGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 4 rows × 3 columns on large screens

  const account = useAccount();
  // Reset to first page when search term changes
  const filteredPieces = useMemo(() => {
    if (!searchTerm) return pieces;
    return pieces.filter(({ piece }) => 
      piece.pieceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      piece.pieceCid.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pieces, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPieces.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPieces = filteredPieces.slice(startIndex, endIndex);

  // Reset to first page if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading pieces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        Error loading pieces: {error.message}
      </div>
    );
  }

  if (filteredPieces.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {searchTerm ? "No pieces found matching your search" : "No pieces available"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredPieces.length)} of {filteredPieces.length} pieces
        </div>
        {searchTerm && (
          <div className="text-sm text-muted-foreground">
            Search results for "{searchTerm}"
          </div>
        )}
      </div>

      {/* Pieces grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentPieces.map(({ piece, dataSet }) => (
          <div
            key={piece.pieceId}
            className="p-3 rounded-md border border-foreground/10 hover:bg-foreground/5 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="bg-blue-50 p-2 rounded-md">
                <FolderGit2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-medium">
                    Piece #{piece.pieceId}
                  </div>
                  {/* Link to explorer */}
                  {dataSet.payee && piece.pieceId && account.address && (
                    <a
                      href={`https://${account.address.toLowerCase()}.calibration.filbeam.io/${piece.pieceCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Open in Filbeam Explorer"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground break-all mb-2">
                  CID:&nbsp;
                  <span>
                    {String(piece.pieceCid).slice(0, 8)}...{String(piece.pieceCid).slice(-8)}
                  </span>
                  <button
                    className="ml-2 p-1 rounded bg-muted hover:bg-muted/70 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Copy CID"
                    onClick={() => {
                      navigator.clipboard.writeText(String(piece.pieceCid));
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {/* First page */}
            {currentPage > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink 
                    onClick={() => handlePageChange(1)}
                    className="cursor-pointer"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 4 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}

            {/* Page numbers around current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={pageNum === currentPage}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink 
                    onClick={() => handlePageChange(totalPages)}
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
