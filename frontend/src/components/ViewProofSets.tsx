import { useProofsets } from "@/hooks/useProofsets";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

export function ViewProofSets() {
  const { data: proofSetsData, isLoading, error } = useProofsets();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading proof sets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading proof sets: {error.message}</p>
      </div>
    );
  }

  if (!proofSetsData?.proofsets.length) {
    return (
      <div className="text-center py-8">
        <p>No proof sets found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proofSetsData.proofsets.map((proofSet) => (
        <Card key={proofSet.pdpVerifierProofSetId}>
          <CardHeader>
            <CardTitle className="text-lg">
              Proof Set #{proofSet.pdpVerifierProofSetId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Provider</Badge>
                <span className="text-sm">
                  {proofSet.provider?.owner || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">PDP URL</Badge>
                <span className="text-sm">{proofSet.pdpUrl || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Payee</Badge>
                <span className="text-sm">
                  {proofSet.payee.slice(0, 6)}...{proofSet.payee.slice(-4)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 