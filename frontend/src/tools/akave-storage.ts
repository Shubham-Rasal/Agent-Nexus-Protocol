import axios from 'axios';

/**
 * Implementation of the Akave Decentralized Storage tool
 */
export const akaveStorageTool = async (params: {
  bucketName: string;
  operation: 'list' | 'info' | 'download' | 'upload';
  fileName?: string;
  fileData?: string; // Base64 encoded file content
  fileType?: string; // MIME type of the file
  createBucket?: boolean; // Create bucket if it doesn't exist
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
  
  // For upload operations, we need fileName, fileData and fileType
  if (params.operation === 'upload') {
    if (!params.fileName) {
      return { success: false, error: 'File name is required for upload.' };
    }
    if (!params.fileData) {
      return { success: false, error: 'File data is required for upload.' };
    }
    if (!params.fileType) {
      return { success: false, error: 'File type is required for upload.' };
    }
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
        
      case 'upload':
        // Upload a file to the specified bucket
        try {
          // First check if bucket exists, create it if needed and requested
          if (params.createBucket) {
            try {
              // Try to access the bucket to see if it exists
              await axios.get(`${API_BASE_URL}/buckets/${params.bucketName}`);
            } catch (error) {
              // If bucket doesn't exist, create it
              await axios.post(`${API_BASE_URL}/buckets`, {
                name: params.bucketName
              });
            }
          }
          
          // Decode base64 data
          if (!params.fileData) {
            throw new Error('File data is required');
          }
          const base64Data = params.fileData.split(',')[1] || params.fileData;
          const binaryData = atob(base64Data);
          const array = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            array[i] = binaryData.charCodeAt(i);
          }
          const blob = new Blob([array], { type: params.fileType });
          
          // Create form data
          const formData = new FormData();
          formData.append('file', blob, params.fileName);
          
          // Upload file to bucket
          endpoint = `/buckets/${params.bucketName}/files`;
          response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          return {
            success: true,
            data: {
              fileName: params.fileName,
              bucketName: params.bucketName,
              ...response.data
            }
          };
        } catch (uploadError) {
          // More detailed error handling for upload
          console.error('File upload error:', uploadError);
          return {
            success: false,
            error: (uploadError as { response?: { data?: { message?: string } }, message?: string })
              .response?.data?.message || 'File upload failed: ' + (uploadError as Error).message
          };
        }
        
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