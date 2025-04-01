import axios from 'axios';

/**
 * Implementation of the Akave Decentralized Storage tool
 */
export const akaveStorageTool = async (params: {
  bucketName: string;
  operation: 'list' | 'info' | 'download';
  fileName?: string;
}): Promise<{ success: boolean; error?: string; data?: any }> => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_AKAVE_API_URL || 'http://localhost:8000';
  
  // Validate required parameters
  if (!params.bucketName) {
    return { success: false, error: 'Bucket name is required.' };
  }
  
  if (!params.operation) {
    return { success: false, error: 'Operation type is required.' };
  }
  
  // For file operations, fileName is required
  if ((params.operation === 'info' || params.operation === 'download') && !params.fileName) {
    return { success: false, error: 'File name is required for this operation.' };
  }

  try {
    let endpoint = '';
    let response;
    
    switch (params.operation) {
      case 'list':
        // List all files in a bucket
        endpoint = `/buckets/${params.bucketName}/files`;
        response = await axios.get(`${API_BASE_URL}${endpoint}`);
        return {
          success: true,
          data: response.data
        };
        
      case 'info':
        // Get file metadata
        endpoint = `/buckets/${params.bucketName}/files/${params.fileName}`;
        response = await axios.get(`${API_BASE_URL}${endpoint}`);
        return {
          success: true,
          data: response.data
        };
        
      case 'download':
        // Download a file
        endpoint = `/buckets/${params.bucketName}/files/${params.fileName}/download`;
        response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          responseType: 'blob'
        });
        
        // Create a download URL
        const url = window.URL.createObjectURL(new Blob([response.data]));
        return {
          success: true,
          data: {
            downloadUrl: url,
            fileName: params.fileName
          }
        };
        
      default:
        return {
          success: false,
          error: `Unsupported operation: ${params.operation}`
        };
    }
  } catch (error) {
    console.error(`Error executing Akave storage operation:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}; 