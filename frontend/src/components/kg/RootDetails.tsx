import Link from "next/link"
import { FolderGit2, Globe, Shield, Cloud } from "lucide-react"
import { Root, ProofSet } from "@/types/proofTypes"
import { Badge } from "@/components/ui/badge"

interface RootDetailsProps {
  root: Root;
  proofSet: ProofSet;
}

export function RootDetails({ root, proofSet }: RootDetailsProps) {
  const isCDN = proofSet.pdpUrl?.includes('cdn') || false;

  return (
    <Link href={`/kg/${root.rootCid}`} className="block">
      <div className="p-3 mt-2 rounded-md hover:bg-slate-50 transition-colors border border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-blue-50 p-2 rounded-md">
              <FolderGit2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Root #{root.rootId}</span>
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  #{proofSet.pdpVerifierProofSetId}
                </Badge>
              </div>
              <span className="text-xs text-slate-500">
                CID: {root.rootCid.slice(0, 8)}...{root.rootCid.slice(-8)}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-xs text-slate-500">
                  <Globe className="w-3 h-3 mr-1" />
                  {proofSet.pdpUrl || 'No PDP URL'}
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