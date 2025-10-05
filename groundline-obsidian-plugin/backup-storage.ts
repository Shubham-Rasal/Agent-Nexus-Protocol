import * as fs from 'fs/promises'
import * as path from 'path'
import { BackupRecord } from './backup-types'

export class BackupStorage {
  private storageFilePath: string

  constructor(storageFilePath: string = './backup-records.json') {
    this.storageFilePath = storageFilePath
  }

  async initialize(): Promise<void> {
    try {
      await fs.access(this.storageFilePath)
    } catch {
      // File doesn't exist, create it with empty array
      await this.saveRecords([])
    }
  }

  async loadRecords(): Promise<BackupRecord[]> {
    try {
      const data = await fs.readFile(this.storageFilePath, 'utf8')
      return JSON.parse(data) as BackupRecord[]
    } catch (error) {
      console.warn('Failed to load backup records:', error)
      return []
    }
  }

  async saveRecords(records: BackupRecord[]): Promise<void> {
    try {
      const dir = path.dirname(this.storageFilePath)
      await fs.mkdir(dir, { recursive: true })
      
      // Convert BigInt values to strings for JSON serialization
      const serializedRecords = records.map(record => ({
        ...record,
        estimatedCost: record.estimatedCost ? {
          ...record.estimatedCost,
          perMonth: record.estimatedCost.perMonth?.toString(),
          perDay: record.estimatedCost.perDay?.toString(),
          perEpoch: record.estimatedCost.perEpoch?.toString()
        } : undefined
      }))
      
      await fs.writeFile(this.storageFilePath, JSON.stringify(serializedRecords, null, 2))
    } catch (error) {
      throw new Error(`Failed to save backup records: ${error}`)
    }
  }

  async addRecord(record: BackupRecord): Promise<void> {
    const records = await this.loadRecords()
    records.push(record)
    await this.saveRecords(records)
  }

  async updateRecord(id: string, updates: Partial<BackupRecord>): Promise<void> {
    const records = await this.loadRecords()
    const index = records.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error(`Backup record with id ${id} not found`)
    }
    records[index] = { ...records[index], ...updates }
    await this.saveRecords(records)
  }

  async getRecord(id: string): Promise<BackupRecord | null> {
    const records = await this.loadRecords()
    return records.find(r => r.id === id) || null
  }

  async getActiveRecords(): Promise<BackupRecord[]> {
    const records = await this.loadRecords()
    return records.filter(r => r.status !== 'expired')
  }

  async getExpiredRecords(): Promise<BackupRecord[]> {
    const records = await this.loadRecords()
    const now = Date.now()
    return records.filter(r => r.expiryTimestamp <= now && r.status !== 'expired')
  }

  async markExpired(id: string): Promise<void> {
    await this.updateRecord(id, { status: 'expired' })
  }

  async getRecordsByStatus(status: BackupRecord['status']): Promise<BackupRecord[]> {
    const records = await this.loadRecords()
    return records.filter(r => r.status === status)
  }

  async getTotalStorageCost(): Promise<{ totalMonthly: number, activeBackups: number }> {
    const activeRecords = await this.getActiveRecords()
    let totalMonthly = 0
    
    for (const record of activeRecords) {
      if (record.estimatedCost?.perMonth) {
        totalMonthly += parseFloat(record.estimatedCost.perMonth.toString())
      }
    }
    
    return {
      totalMonthly,
      activeBackups: activeRecords.length
    }
  }
}