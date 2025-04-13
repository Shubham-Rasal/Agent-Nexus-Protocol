// StorachaService for Agent Nexus Protocol
// Handles interaction with Storacha API for storing and retrieving agent data

/**
 * Types of data that can be stored in Storacha
 */
export type StorachaDataType = 
  | 'input'
  | 'output'
  | 'chain_of_thought'
  | 'code_artifact'
  | 'execution_artifact'
  | 'model_artifact'
  | 'training_data'
  | 'metadata'
  | 'annotations';

/**
 * Data structure for items stored in Storacha
 */
export interface StorachaItem {
  id: string;
  agentId: string;
  dataType: StorachaDataType;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * User approval record for accessing storage
 */
interface UserApproval {
  agentId: string;
  approved: boolean;
  timestamp: number;
  expiration: number; // Timestamp when approval expires
}

/**
 * StorachaService handles interactions with the Storacha API
 * and manages user approvals for storage access
 */
export class StorachaService {
  private static instance: StorachaService;
  private approvals: Record<string, UserApproval> = {};
  private localCache: Record<string, StorachaItem> = {};
  private hasRequestedApproval = false;

  private constructor() {
    // Load any existing approvals from localStorage
    try {
      const savedApprovals = localStorage.getItem('anp_storacha_approvals');
      if (savedApprovals) {
        this.approvals = JSON.parse(savedApprovals);
        // Filter out expired approvals
        const now = Date.now();
        Object.keys(this.approvals).forEach(key => {
          if (this.approvals[key].expiration < now) {
            delete this.approvals[key];
          }
        });
        // Save filtered approvals
        this.saveApprovals();
      }
    } catch (error) {
      console.error('Error loading Storacha approvals:', error);
    }

    // Add a listener for when the page is being unloaded to persist the cache
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.persistCache();
      });

      // Try to load any previously cached items
      this.loadCache();
    }
  }

  /**
   * Get the singleton instance of StorachaService
   */
  public static getInstance(): StorachaService {
    if (!StorachaService.instance) {
      StorachaService.instance = new StorachaService();
    }
    return StorachaService.instance;
  }

  /**
   * Save approvals to localStorage
   */
  private saveApprovals(): void {
    try {
      localStorage.setItem('anp_storacha_approvals', JSON.stringify(this.approvals));
    } catch (error) {
      console.error('Error saving Storacha approvals:', error);
    }
  }

  /**
   * Persist cache to localStorage
   */
  private persistCache(): void {
    try {
      localStorage.setItem('anp_storacha_cache', JSON.stringify(this.localCache));
    } catch (error) {
      console.error('Error persisting Storacha cache:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    try {
      const cachedData = localStorage.getItem('anp_storacha_cache');
      if (cachedData) {
        this.localCache = JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('Error loading Storacha cache:', error);
    }
  }

  /**
   * Check if an agent has user approval to access storage
   */
  public hasApproval(agentId: string): boolean {
    const approval = this.approvals[agentId];
    if (!approval) return false;

    // Check if approval has expired
    if (approval.expiration < Date.now()) {
      delete this.approvals[agentId];
      this.saveApprovals();
      return false;
    }

    return approval.approved;
  }

  /**
   * Request user approval for an agent to access storage
   * Returns a promise that resolves to true if approved, false otherwise
   */
  public async requestApproval(agentId: string): Promise<boolean> {
    // If we've already asked for approval in this session, don't ask again
    if (this.hasRequestedApproval) {
      return Promise.resolve(true);
    }

    // Check if we already have a valid approval
    if (this.hasApproval(agentId)) {
      return Promise.resolve(true);
    }

    // Otherwise, we need to ask the user
    this.hasRequestedApproval = true;
    return new Promise((resolve) => {
      const isApproved = window.confirm(
        `The ${agentId} agent is requesting access to shared storage to maintain context between agents. Do you approve?`
      );

      const approval: UserApproval = {
        agentId,
        approved: isApproved,
        timestamp: Date.now(),
        // Approval expires after 1 hour
        expiration: Date.now() + 60 * 60 * 1000
      };

      this.approvals[agentId] = approval;
      this.saveApprovals();
      resolve(isApproved);
    });
  }

  /**
   * Generate a unique ID for a stored item
   */
  private generateItemId(agentId: string, dataType: StorachaDataType): string {
    return `${agentId}_${dataType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Store an item in Storacha
   * Returns a promise that resolves to the item's ID
   */
  public async storeItem(
    agentId: string,
    dataType: StorachaDataType,
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    // First check for approval
    const hasApproval = await this.requestApproval(agentId);
    if (!hasApproval) {
      throw new Error(`Storage access denied for agent ${agentId}`);
    }

    // Create the item
    const id = this.generateItemId(agentId, dataType);
    const item: StorachaItem = {
      id,
      agentId,
      dataType,
      content,
      timestamp: Date.now(),
      metadata
    };

    // Store in local cache immediately
    this.localCache[id] = item;
    this.persistCache();

    try {
      // Create FormData for the upload
      const formData = new FormData();
      const jsonBlob = new Blob([JSON.stringify(item)], { type: 'application/json' });
      formData.append('files', jsonBlob, `${id}.json`);

      // Upload to Storacha
      const response = await fetch('/api/storacha/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update metadata with CID
      item.metadata = {
        ...(item.metadata || {}),
        storacha: {
          cid: result.cid,
          url: result.url
        }
      };

      // Update cache with the updated item
      this.localCache[id] = item;
      this.persistCache();

      return id;
    } catch (error) {
      console.error('Error uploading to Storacha:', error);
      // Even if upload fails, we still return the ID since we have the item in local cache
      return id;
    }
  }

  /**
   * Download an item from Storacha by CID
   */
  public async downloadByCid(cid: string): Promise<any> {
    try {
      const response = await fetch(`/api/storacha/download?cid=${encodeURIComponent(cid)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Download failed: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }
      
      return {
        content: result.content,
        contentType: result.contentType
      };
    } catch (error) {
      console.error('Error downloading from Storacha:', error);
      throw error;
    }
  }

  /**
   * Download an item from Storacha by its ID
   */
  public async downloadItemById(itemId: string, agentId: string): Promise<StorachaItem | null> {
    // First check for approval
    const hasApproval = await this.requestApproval(agentId);
    if (!hasApproval) {
      throw new Error(`Storage access denied for agent ${agentId}`);
    }
    
    // First check if we have it in local cache
    if (this.localCache[itemId]) {
      return this.localCache[itemId];
    }
    
    // If not in cache, check if we have a CID for it
    for (const item of Object.values(this.localCache)) {
      if (item.id === itemId && item.metadata?.storacha?.cid) {
        try {
          const downloadedData = await this.downloadByCid(item.metadata.storacha.cid);
          return JSON.parse(downloadedData.content);
        } catch (error) {
          console.error(`Error downloading item ${itemId}:`, error);
          return null;
        }
      }
    }
    
    return null;
  }

  /**
   * Retrieve items from Storacha by agent and type
   * Returns a promise that resolves to an array of items
   */
  public async getItems(
    agentId: string, 
    dataTypes?: StorachaDataType[],
    metadata?: Record<string, any>
  ): Promise<StorachaItem[]> {
    // First check for approval
    const hasApproval = await this.requestApproval(agentId);
    if (!hasApproval) {
      throw new Error(`Storage access denied for agent ${agentId}`);
    }

    // Filter items from local cache
    const items = Object.values(this.localCache).filter(item => {
      // Filter by agent ID (include items that are shared with all agents)
      if (item.agentId !== agentId && item.agentId !== 'shared') return false;
      
      // Filter by data types if specified
      if (dataTypes && !dataTypes.includes(item.dataType)) return false;
      
      // Filter by metadata if specified
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          if (!item.metadata || item.metadata[key] !== value) return false;
        }
      }
      
      return true;
    });

    // TODO: In a real implementation, we would fetch from Storacha API here
    // For now, just return from local cache
    return items;
  }

  /**
   * Get all items for all agents
   */
  public async getAllItems(): Promise<StorachaItem[]> {
    // Since we don't have a real API to query all items, 
    // just return everything from local cache
    return Object.values(this.localCache);
  }

  /**
   * Store an item that can be accessed by any agent (shared storage)
   */
  public async storeSharedItem(
    dataType: StorachaDataType,
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.storeItem('shared', dataType, content, metadata);
  }

  /**
   * Get reputation data for agents
   * This collects interaction data that can be used for reputation scoring
   */
  public async getAgentReputationData(): Promise<Record<string, any>> {
    const allItems = await this.getAllItems();
    
    // Calculate usage statistics by agent
    const agentStats: Record<string, any> = {};
    
    allItems.forEach(item => {
      if (!agentStats[item.agentId]) {
        agentStats[item.agentId] = {
          uploads: 0,
          downloads: 0,
          dataTypes: {},
          latestTimestamp: 0
        };
      }
      
      // Count uploads
      agentStats[item.agentId].uploads++;
      
      // Count by data type
      if (!agentStats[item.agentId].dataTypes[item.dataType]) {
        agentStats[item.agentId].dataTypes[item.dataType] = 0;
      }
      agentStats[item.agentId].dataTypes[item.dataType]++;
      
      // Update latest timestamp
      if (item.timestamp > agentStats[item.agentId].latestTimestamp) {
        agentStats[item.agentId].latestTimestamp = item.timestamp;
      }
    });
    
    return agentStats;
  }
}

/**
 * Convenience function to get the StorachaService instance
 */
export function getStorachaService(): StorachaService {
  return StorachaService.getInstance();
} 