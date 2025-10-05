import { RPC_URLS, Synapse, WarmStorageService } from '@filoz/synapse-sdk'
import { BackupServiceConfig } from './backup-types'
import { BackupStorage } from './backup-storage'
import { Notice } from 'obsidian'

export interface BackupContext {
  synapse: Synapse
  warmStorageService: any // Accessed through synapse.warmStorage
  backupStorage: BackupStorage
  config: BackupServiceConfig
  clientAddress: string
}

export class BackupContextManager {
  private static instance: BackupContext | null = null

  static async createContext(config: BackupServiceConfig): Promise<BackupContext> {
    console.log('🔧 Initializing Backup Context...')
    
    // Initialize Synapse SDK
    const synapse = await Synapse.create({
      privateKey: config.synapseConfig.privateKey,
      rpcURL: config.synapseConfig.rpcURL,
      withCDN: true
    })

    // Use warm storage through synapse instance
    const warmStorageAddress = synapse.getWarmStorageAddress()
    const provider = synapse.getProvider()
    const warmStorageService = await WarmStorageService.create(provider, warmStorageAddress)

    // Get client address
    const clientAddress = await synapse.getSigner().getAddress()
    new Notice(`📧 Client Address: ${clientAddress}`)

    // Use default dataset ID 24
    const finalDataSetId = 24
    config.dataSetId = finalDataSetId
    console.log(`📦 Using default dataset ID: ${finalDataSetId}`)

    // Initialize backup storage
    const backupStorage = new BackupStorage(config.storageFilePath)
    await backupStorage.initialize()

    const context: BackupContext = {
      synapse,
      warmStorageService,
      backupStorage,
      config,
      clientAddress
    }

    // Cache the context for reuse
    BackupContextManager.instance = context

    console.log('✅ Backup Context initialized successfully')
    console.log(`📧 Client Address: ${clientAddress}`)
    console.log(`🗄️  Storage File: ${config.storageFilePath}`)
    console.log(`📦 Dataset ID: ${finalDataSetId}`)

    return context
  }

  static getContext(): BackupContext {
    if (!BackupContextManager.instance) {
      throw new Error('Backup context not initialized. Call createContext() first.')
    }
    return BackupContextManager.instance
  }

  static isInitialized(): boolean {
    return BackupContextManager.instance !== null
  }

  static async getOrCreateContext(config: BackupServiceConfig): Promise<BackupContext> {
    if (BackupContextManager.isInitialized()) {
      return BackupContextManager.getContext()
    }
    return await BackupContextManager.createContext(config)
  }

  static clearContext(): void {
    BackupContextManager.instance = null
  }
}

// Default configuration for easy access
export const getDefaultConfig = (): BackupServiceConfig => ({
  synapseConfig: {
    privateKey: process.env.PRIVATE_KEY || '',
    rpcURL: process.env.RPC_URL || RPC_URLS.calibration.http,
    withCDN: true
  },
  defaultRetentionDays: 7,
  dataSetId: 24,
  storageFilePath: './demo-backup-records.json'
})

// Helper functions for common operations using context
export class BackupContextHelpers {
  static async estimateStorageCost(fileSize: number): Promise<any> {
    const context = BackupContextManager.getContext()
    return await context.warmStorageService.calculateStorageCost(fileSize)
  }

  static async getClientDataSets(): Promise<any[]> {
    const context = BackupContextManager.getContext()
    return await context.warmStorageService.getClientDataSetsWithDetails(context.clientAddress)
  }

  static async createStorageContext(metadata?: Record<string, string>): Promise<any> {
    const context = BackupContextManager.getContext()
    return await context.synapse.storage.createContext({
      withCDN: true,
      dataSetId: 24, // Use default dataset
      // metadata,
      callbacks: {
        onDataSetResolved: (info: any) => {
          console.log(`📦 Using data set ${info.dataSetId}`)
        }
      }
    })
  }

  static async downloadFromStorage(pieceCid: string): Promise<Uint8Array> {
    const context = BackupContextManager.getContext()
    return await context.synapse.storage.download(pieceCid)
  }

  static getBackupStorage(): BackupStorage {
    const context = BackupContextManager.getContext()
    return context.backupStorage
  }

  static getSynapse(): Synapse {
    const context = BackupContextManager.getContext()
    return context.synapse
  }

  static getWarmStorageService(): any {
    const context = BackupContextManager.getContext()
    return context.warmStorageService
  }

  static getConfig(): BackupServiceConfig {
    const context = BackupContextManager.getContext()
    return context.config
  }

  static getClientAddress(): string {
    const context = BackupContextManager.getContext()
    return context.clientAddress
  }

  static async createNewDataSet(metadata?: Record<string, string>): Promise<number> {
    // Always return default dataset ID 24
    console.log('📦 Using default dataset ID: 24')
    return 24
  }

  static async listClientDataSets(): Promise<{ id: number, pieces: number, provider: string }[]> {
    const context = BackupContextManager.getContext()
    const dataSets = await context.warmStorageService.getClientDataSetsWithDetails(context.clientAddress)
    
    return dataSets.map((ds: any) => ({
      id: ds.clientDataSetId,
      pieces: ds.currentPieceCount,
      provider: ds.serviceProvider
    }))
  }
}