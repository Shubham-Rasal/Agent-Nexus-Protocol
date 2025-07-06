"use client"

import { useState } from "react"
import { useProofsets } from "@/hooks/useProofsets"
import { ProofSetSelector } from "@/components/kg/ProofSetSelector"
import { SearchInput } from "@/components/kg/SearchInput"
import { RootsGrid } from "@/components/kg/RootsGrid"

export default function GraphDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProofSet, setSelectedProofSet] = useState<number | null>(null)
  const { data: proofSetsData, isLoading, error } = useProofsets()

  const filteredRoots = selectedProofSet && proofSetsData
    ? proofSetsData.proofsets
        .filter(ps => ps.pdpVerifierProofSetId === selectedProofSet)
        .flatMap(ps => (ps.details?.roots || []).map(root => ({ root, proofSet: ps })))
    : proofSetsData?.proofsets.flatMap(ps => 
        (ps.details?.roots || []).map(root => ({ root, proofSet: ps }))
      ) || []

  const searchFilteredRoots = filteredRoots.filter(({ root }) => 
    root.rootId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    root.rootCid.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8 px-4 pt-16">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <ProofSetSelector
            selectedProofSet={selectedProofSet}
            proofSets={proofSetsData?.proofsets || []}
            onSelectProofSet={setSelectedProofSet}
          />
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <RootsGrid
          roots={searchFilteredRoots}
          isLoading={isLoading}
          error={error}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  )
}
