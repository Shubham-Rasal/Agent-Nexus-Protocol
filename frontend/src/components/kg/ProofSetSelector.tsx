import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProofSet } from "@/types/proofTypes"

interface ProofSetSelectorProps {
  selectedProofSet: number | null;
  proofSets: ProofSet[];
  onSelectProofSet: (proofSetId: number | null) => void;
}

export function ProofSetSelector({ selectedProofSet, proofSets, onSelectProofSet }: ProofSetSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {selectedProofSet 
            ? `Proof Set #${selectedProofSet}`
            : "All Proof Sets"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuItem onClick={() => onSelectProofSet(null)}>
          All Proof Sets
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {proofSets.map((ps) => (
          <DropdownMenuItem 
            key={ps.pdpVerifierProofSetId}
            onClick={() => onSelectProofSet(ps.pdpVerifierProofSetId)}
          >
            Proof Set #{ps.pdpVerifierProofSetId}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 