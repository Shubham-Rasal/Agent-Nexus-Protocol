
export async function akaveStorageTool(params: {
  bucketName: string;
  operation: 'list' | 'info' | 'download' | 'upload';
  fileName?: string;
  fileData?: string; // Base64 encoded file content
  fileType?: string; // MIME type of the file
}): Promise<{ success: boolean; error?: string; data?: any }> {
  const API_BASE_URL =  'http://localhost:8000';
  const BUCKET_NAME = "myBucket";
  
  // Override any provided bucket name with the hardcoded one
  params.bucketName = BUCKET_NAME;
  
  // Validate required parameters
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
        endpoint = `/buckets/${BUCKET_NAME}/files`;
        response = await fetch(`${API_BASE_URL}${endpoint}`);
        const listData = await response.json();
        return {
          success: true,
          data: listData
        };
        
      case 'info':
        // Get file metadata
        endpoint = `/buckets/${BUCKET_NAME}/files/${params.fileName}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`);
        const infoData = await response.json();
        return {
          success: true,
          data: infoData
        };
        
      case 'download':
        // Download a file
        endpoint = `/buckets/${BUCKET_NAME}/files/${params.fileName}/download`;
        response = await fetch(`${API_BASE_URL}${endpoint}`);
        const blob = await response.blob();
        
        // Create a download URL
        const url = URL.createObjectURL(blob);
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
          // Decode base64 data
          if (!params.fileData) {
            throw new Error('File data is required');
          }
          
          // Clean the base64 string - remove data URL prefix if present
          let base64Data = params.fileData;
          if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
          }
          
          // Handle base64 decoding safely
          let fileBlob;
          try {
            // Method 1: Using Buffer in Node.js environment
            if (typeof Buffer !== 'undefined') {
              const buffer = Buffer.from(base64Data, 'base64');
              fileBlob = new Blob([buffer], { type: params.fileType });
            } 
            // Method 2: Using fetch API and base64 decoding
            else {
              // Convert base64 to URL format for fetch
              const dataUrl = `data:${params.fileType};base64,${base64Data}`;
              const fetchResponse = await fetch(dataUrl);
              fileBlob = await fetchResponse.blob();
            }
          } catch (decodeError) {
            console.error('Error decoding base64 data:', decodeError);
            return {
              success: false,
              error: `Failed to decode file data: ${(decodeError as Error).message}`
            };
          }
          
          // Create form data
          const formData = new FormData();
          formData.append('file', fileBlob, params.fileName);
          
          // Upload file to bucket
          endpoint = `/buckets/${BUCKET_NAME}/files`;
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData
          });
          
          const uploadData = await response.json();
          return {
            success: true,
            data: {
              fileName: params.fileName,
              bucketName: BUCKET_NAME,
              ...uploadData
            }
          };
        } catch (uploadError) {
          // More detailed error handling for upload
          console.error('File upload error:', uploadError);
          return {
            success: false,
            error: uploadError instanceof Error 
              ? uploadError.message 
              : 'File upload failed'
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
}