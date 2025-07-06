import { Root, ProofSet } from "@/types/proofTypes"
import { RootDetails } from "./RootDetails"

interface RootsGridProps {
  roots: Array<{
    root: Root;
    proofSet: ProofSet;
  }>;
  isLoading: boolean;
  error?: Error | null;
  searchTerm: string;
}

export function RootsGrid({ roots, isLoading, error, searchTerm }: RootsGridProps) {
  if (isLoading) {
    return <div className="text-center py-8">Loading roots...</div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">Error loading roots: {error.message}</div>
  }

  if (roots.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        {searchTerm ? "No roots found matching your search" : "No roots available"}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roots.map(({ root, proofSet }) => (
        <RootDetails 
          key={root.rootId} 
          root={root} 
          proofSet={proofSet}
        />
      ))}
    </div>
  )
} 