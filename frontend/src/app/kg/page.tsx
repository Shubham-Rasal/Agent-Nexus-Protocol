"use client"

import { useState } from "react"
import { useDataSets } from "@/hooks/useDataSets"
import { useDataSetPieces } from "@/hooks/useDataSetPieces"
import { DataSetSelector } from "@/components/kg/DataSetSelector"
import { SearchInput } from "@/components/kg/SearchInput"
import { PiecesGrid } from "@/components/kg/PiecesGrid"

export default function GraphDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDataSet, setSelectedDataSet] = useState<number | null>(null)
  const { data: dataSetsData, isLoading, error } = useDataSets()
  const { data: piecesData, isLoading: piecesLoading, error: piecesError } = useDataSetPieces(selectedDataSet)
  
  console.log("DataSets:", dataSetsData);
  console.log("Pieces:", piecesData);

  // Filter pieces based on search term
  const searchFilteredPieces = piecesData?.pieces.filter(({ piece }) => 
    piece.pieceCid?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    piece.pieceId?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="container mx-auto py-8 px-4 pt-16">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <DataSetSelector
            selectedDataSet={selectedDataSet}
            dataSets={dataSetsData || []}
            onSelectDataSet={setSelectedDataSet}
          />
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {!selectedDataSet ? (
          <div className="text-center py-8 text-slate-500">
            <p>Please select a data set to view its pieces.</p>
          </div>
        ) : (
          <PiecesGrid
            pieces={searchFilteredPieces}
            isLoading={isLoading || piecesLoading}
            error={error || piecesError}
            searchTerm={searchTerm}
          />
        )}
      </div>
    </div>
  )
}
