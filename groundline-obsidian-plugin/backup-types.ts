export interface SynapseConfig {
  privateKey: string;
  rpcURL: string;
  withCDN?: boolean;
}

export interface BackupServiceConfig {
  synapseConfig: SynapseConfig;
  defaultRetentionDays: number;
  dataSetId?: number;
  storageFilePath: string;
}

export interface BackupRecord {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  uploadTimestamp: number;
  retentionDays: number;
  expiryTimestamp: number;
  status: 'pending' | 'uploaded' | 'failed' | 'expired';
  pieceCid?: string;
  dataSetId?: number;
  estimatedCost?: {
    perMonth?: string;
    perDay?: string;
    perEpoch?: string;
  };
  calculatedCost?: {
    totalCost: string;
    dailyRate: string;
    monthlyRate: string;
  };
  metadata?: Record<string, any>;
}

export interface RetentionPolicy {
  name: string;
  retentionDays: number;
  description: string;
  costMultiplier: number;
  category: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
}

export const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    name: 'Daily Backup',
    retentionDays: 1,
    description: 'Keep backup for 1 day',
    costMultiplier: 1.0,
    category: 'daily'
  },
  {
    name: 'Weekly Backup',
    retentionDays: 7,
    description: 'Keep backup for 1 week',
    costMultiplier: 1.0,
    category: 'weekly'
  },
  {
    name: 'Monthly Backup',
    retentionDays: 30,
    description: 'Keep backup for 1 month',
    costMultiplier: 0.9,
    category: 'monthly'
  },
  {
    name: 'Quarterly Backup',
    retentionDays: 90,
    description: 'Keep backup for 3 months',
    costMultiplier: 0.8,
    category: 'quarterly'
  },
  {
    name: 'Yearly Backup',
    retentionDays: 365,
    description: 'Keep backup for 1 year',
    costMultiplier: 0.7,
    category: 'yearly'
  }
];

export interface BackupMetadata {
  category?: string;
  sensitivity?: string;
  source?: string;
  originalPath?: string;
  fileType?: string;
  vault?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface BackupListResponse {
  backups: BackupRecord[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface StorageStats {
  totalBackups: number;
  activeBackups: number;
  expiredBackups: number;
  failedBackups: number;
  totalMonthlyCost: number;
  totalStorageUsed: number;
  dataSetCount: number;
}

export interface BackupProgress {
  recordId: string;
  fileName: string;
  status: 'preparing' | 'uploading' | 'verifying' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface CostAnalysis {
  fileSize: number;
  retentionDays: number;
  estimatedMonthlyCost: string;
  estimatedTotalCost: string;
  costPerDay: string;
  currency: string;
}

export interface ProvenanceInfo {
  sourceFile: {
    path: string;
    name: string;
    size: number;
    uploadDate: string;
  };
  backupSystem: {
    service: string;
    version: string;
    backupId: string;
  };
  storage: {
    pieceCid?: string;
    dataSetId?: number;
    status: string;
  };
  retentionPolicy: {
    retentionDays: number;
    scheduledDate: string;
    expiryDate: string;
    daysRemaining: number;
    isExpired: boolean;
  };
  costAnalysis: {
    calculatedCost?: any;
    estimatedCost?: any;
    costPerDay?: string;
    totalPaid?: string;
  };
}