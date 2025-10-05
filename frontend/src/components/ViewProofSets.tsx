import { useDataSets } from "@/hooks/useDataSets";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

export function ViewDataSets() {
  const { data: dataSetsData, isLoading, error } = useDataSets();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading data sets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading data sets: {error.message}</p>
      </div>
    );
  }

  if (!dataSetsData?.datasets.length) {
    return (
      <div className="text-center py-8">
        <p>No data sets found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dataSetsData.datasets.map((dataSet) => (
        <Card key={dataSet.pdpVerifierDataSetId}>
          <CardHeader>
            <CardTitle className="text-lg">
              Data Set #{dataSet.pdpVerifierDataSetId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Service Provider</Badge>
                <span className="text-sm">
                  {dataSet.provider?.serviceProvider || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Service URL</Badge>
                <span className="text-sm">{dataSet.serviceURL || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Payee</Badge>
                <span className="text-sm">
                  {dataSet.payee.slice(0, 6)}...{dataSet.payee.slice(-4)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 