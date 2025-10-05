import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataSet } from "@/types/proofTypes"

interface DataSetSelectorProps {
  selectedDataSet: number | null;
  dataSets: DataSet[];
  onSelectDataSet: (dataSetId: number | null) => void;
}

export function DataSetSelector({ selectedDataSet, dataSets, onSelectDataSet }: DataSetSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {selectedDataSet 
            ? `Data Set #${selectedDataSet}`
            : "All Data Sets"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuItem onClick={() => onSelectDataSet(null)}>
          All Data Sets
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {dataSets.map((ds) => (
          <DropdownMenuItem 
            key={ds.pdpVerifierDataSetId}
            onClick={() => onSelectDataSet(ds.pdpVerifierDataSetId)}
          >
            Data Set #{ds.pdpVerifierDataSetId}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 