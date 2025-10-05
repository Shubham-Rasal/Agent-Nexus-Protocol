import { Piece, DataSet } from "@/types/proofTypes"
import { RootDetails } from "./RootDetails"

interface PiecesGridProps {
  pieces: Array<{
    piece: Piece;
    dataSet: DataSet;
  }>;
  isLoading: boolean;
  error?: Error | null;
  searchTerm: string;
}

export function PiecesGrid({ pieces, isLoading, error, searchTerm }: PiecesGridProps) {
  if (isLoading) {
    return <div className="text-center py-8">Loading pieces...</div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">Error loading pieces: {error.message}</div>
  }

  if (pieces.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        {searchTerm ? "No pieces found matching your search" : "No pieces available"}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pieces.map(({ piece, dataSet }) => (
        <PieceDetails 
          key={piece.pieceId} 
          piece={piece} 
          dataSet={dataSet}
        />
      ))}
    </div>
  )
} 