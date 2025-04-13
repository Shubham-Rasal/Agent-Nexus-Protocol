import { getStorachaService, StorachaDataType } from './storacha-service';
import { akaveStorageTool } from './akave-storage';

/**
 * Enhanced Storacha Tool that provides a common interface for agents 
 * to store and retrieve data with context sharing
 */
export async function storachaTool(params: {
  agentId: string;
  operation: 'store' | 'retrieve' | 'list' | 'share';
  dataType?: StorachaDataType;
  content?: string;
  metadata?: Record<string, any>;
  itemId?: string;
  targetAgent?: string;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const storachaService = getStorachaService();
    
    // Validate required parameters
    if (!params.operation) {
      return { success: false, error: 'Operation type is required.' };
    }
    
    if (!params.agentId) {
      return { success: false, error: 'Agent ID is required.' };
    }

    switch (params.operation) {
      case 'store':
        // Store data in Storacha
        if (!params.dataType) {
          return { success: false, error: 'Data type is required for store operation.' };
        }
        if (!params.content) {
          return { success: false, error: 'Content is required for store operation.' };
        }
        
        try {
          // Store the item 
          const itemId = await storachaService.storeItem(
            params.agentId,
            params.dataType,
            params.content,
            params.metadata
          );
          
          return {
            success: true,
            data: {
              itemId,
              agentId: params.agentId,
              dataType: params.dataType,
              timestamp: Date.now()
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to store item'
          };
        }
      
      case 'retrieve':
        // Retrieve data from Storacha
        try {
          let items;
          
          if (params.itemId) {
            // Retrieve a specific item by ID
            const item = await storachaService.downloadItemById(params.itemId, params.agentId);
            items = item ? [item] : [];
          } else {
            // Retrieve items by filter
            items = await storachaService.getItems(
              params.agentId,
              params.dataType ? [params.dataType] : undefined,
              params.metadata
            );
          }
          
          return {
            success: true,
            data: items
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve items'
          };
        }
      
      case 'list':
        // List available items
        try {
          const items = await storachaService.getItems(
            params.agentId,
            params.dataType ? [params.dataType] : undefined,
            params.metadata
          );
          
          // Format the items as a simple list with basic info
          const itemList = items.map(item => ({
            id: item.id,
            dataType: item.dataType,
            timestamp: item.timestamp,
            metadata: item.metadata
          }));
          
          return {
            success: true,
            data: itemList
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list items'
          };
        }
      
      case 'share':
        // Share data with another agent or make it globally accessible
        if (!params.dataType) {
          return { success: false, error: 'Data type is required for share operation.' };
        }
        if (!params.content) {
          return { success: false, error: 'Content is required for share operation.' };
        }
        
        try {
          // Store the item with shared access
          const itemId = await storachaService.storeSharedItem(
            params.dataType,
            params.content,
            {
              ...params.metadata,
              sourceAgentId: params.agentId
            }
          );
          
          return {
            success: true,
            data: {
              itemId,
              agentId: 'shared',
              dataType: params.dataType,
              timestamp: Date.now()
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to share item'
          };
        }
      
      default:
        return {
          success: false,
          error: `Unsupported operation: ${params.operation}`
        };
    }
  } catch (error) {
    console.error(`Error executing Storacha tool:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Compatibility adapter for existing akave-storage tool
 * This allows the storacha tool to be used with the akave-storage interface
 */
export async function akaveStorachaAdapter(params: {
  bucketName: string;
  operation: 'list' | 'info' | 'download' | 'upload';
  fileName?: string;
  fileData?: string; // Base64 encoded file content
  fileType?: string; // MIME type of the file
  agentId?: string; // Optional agent ID, defaults to 'unknown'
}): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Default agent ID if not provided
    const agentId = params.agentId || 'unknown';
    
    switch (params.operation) {
      case 'list':
        // List files - map to storacha list operation
        return storachaTool({
          agentId,
          operation: 'list'
        });
        
      case 'info':
        // Get info about a file
        if (!params.fileName) {
          return { success: false, error: 'File name is required for info operation.' };
        }
        
        // Use the akave storage tool for info operations
        return akaveStorageTool(params);
        
      case 'download':
        // Download a file
        if (!params.fileName) {
          return { success: false, error: 'File name is required for download operation.' };
        }
        
        try {
          // Try to find the file in storacha by filename
          const items = await getStorachaService().getItems(
            agentId,
            undefined,
            { fileName: params.fileName }
          );
          
          if (items.length > 0) {
            // Return the first matching item
            return {
              success: true,
              data: {
                content: items[0].content,
                fileName: params.fileName,
                contentType: items[0].metadata?.fileType || 'application/json',
                size: items[0].content.length
              }
            };
          }
          
          // If not found in storacha, fall back to akave storage
          return akaveStorageTool(params);
        } catch (error) {
          // Fall back to akave storage
          return akaveStorageTool(params);
        }
        
      case 'upload':
        // Upload a file
        if (!params.fileName || !params.fileData) {
          return { success: false, error: 'File name and data are required for upload operation.' };
        }
        
        try {
          // Store in storacha
          const result = await storachaTool({
            agentId,
            operation: 'store',
            dataType: 'code_artifact', // Default type for files
            content: params.fileData,
            metadata: {
              fileName: params.fileName,
              fileType: params.fileType || 'application/octet-stream'
            }
          });
          
          if (result.success) {
            // Also upload to akave storage for compatibility
            const akaveResult = await akaveStorageTool(params);
            
            // Combine the results
            return {
              success: true,
              data: {
                ...result.data,
                akaveResult: akaveResult.success ? akaveResult.data : 'Failed'
              }
            };
          }
          
          // If storacha fails, fall back to akave storage
          return akaveStorageTool(params);
        } catch (error) {
          // Fall back to akave storage
          return akaveStorageTool(params);
        }
        
      default:
        return {
          success: false,
          error: `Unsupported operation: ${params.operation}`
        };
    }
  } catch (error) {
    console.error(`Error in akaveStorachaAdapter:`, error);
    // Fall back to akave storage
    return akaveStorageTool(params);
  }
} 