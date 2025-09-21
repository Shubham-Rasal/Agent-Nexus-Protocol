export interface Provider {
  serviceProvider: string;
  serviceURL: string;
  // Add other provider fields as needed
}

export interface Piece {
  pieceId: string;
  timestamp: string;
  pieceCid: string;
}

export interface DataSetDetails {
  serviceURL?: string;
  pieces?: Piece[];
  // Add other data set detail fields as needed
}

export interface DataSet {
  pdpVerifierDataSetId: number;
  payee: string;
  details: DataSetDetails | null;
  serviceURL: string | null;
  provider: Provider | null;
}

export interface DataSetsResponse {
  datasets: DataSet[];
} 