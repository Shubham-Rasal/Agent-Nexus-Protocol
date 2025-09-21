import Link from "next/link"
import { FolderGit2, Globe, Shield, Cloud } from "lucide-react"
import { Piece } from "@/types/proofTypes"
import { EnhancedDataSetInfo } from "@filoz/synapse-sdk";
import { Badge } from "@/components/ui/badge"

interface PieceDetailsProps {
  piece: Piece;
  dataSet: EnhancedDataSetInfo;
}

export function PieceDetails({ piece, dataSet }: PieceDetailsProps) {
  const isCDN = dataSet.serviceProvider?.includes('cdn') || false;

  return (
    <Link href={`/kg/${String(piece.pieceCid)}`} className="block">
      <div className="p-3 mt-2 rounded-md hover:bg-slate-50 transition-colors border border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-blue-50 p-2 rounded-md">
              <FolderGit2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Piece #{piece.pieceId}</span>
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  #{dataSet.pdpVerifierDataSetId}
                </Badge>
              </div>
              <span className="text-xs text-slate-500">
                CID: {String(piece.pieceCid).slice(0, 8)}...{String(piece.pieceCid).slice(-8)}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-xs text-slate-500">
                  <Globe className="w-3 h-3 mr-1" />
                  {dataSet.serviceProvider || 'No Service URL'}
                </div>
                {isCDN && (
                  <Badge variant="secondary" className="text-xs">
                    <Cloud className="w-3 h-3 mr-1" />
                    CDN
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
} 