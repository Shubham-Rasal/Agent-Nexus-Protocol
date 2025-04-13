# Storacha Upload API

This API endpoint provides a simplified way to upload files to Storacha directly from your Next.js application. It handles the delegation process internally, so frontend clients only need to submit files.

## How It Works

1. The API receives files from the frontend
2. It creates a new Storacha client with a unique agent DID
3. It requests a delegation from the `/api/storacha/delegation` endpoint
4. It uses the delegation to upload the files to your Storacha space
5. It returns the results, including the IPFS CID and gateway URL

## Usage

### From Client-Side JavaScript/TypeScript

```typescript
async function uploadFiles(files: File[]) {
  const formData = new FormData();
  
  // Append all files to the FormData
  files.forEach(file => {
    formData.append('files', file);
  });
  
  // Send the request to the upload API
  const response = await fetch('/api/storacha/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Upload failed: ${errorData.error}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Upload failed');
  }
  
  return {
    cid: result.cid,
    url: result.url,
    files: result.files
  };
}
```

### Using Our React Component

We provide a simplified React component that handles the entire file upload process:

```jsx
import SimplifiedStorachaUploader from '@/app/components/SimplifiedStorachaUploader';

export default function YourPage() {
  return (
    <div>
      <h1>Upload Files to Storacha</h1>
      <SimplifiedStorachaUploader />
    </div>
  );
}
```

## API Response

The API returns a JSON object with the following structure:

**Success Response:**
```json
{
  "success": true,
  "cid": "bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354",
  "url": "https://w3s.link/ipfs/bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354",
  "files": ["file1.jpg", "file2.pdf"]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message explaining what went wrong"
}
```

## Dependencies

This API endpoint depends on:
- The `/api/storacha/delegation` endpoint for obtaining delegations
- The environment variables set up for the delegation API
- The `@web3-storage/w3up-client` package

## Benefits

- **Simplified Client-Side Code**: Clients only need to send files, not worry about delegation
- **Improved User Experience**: Less client-side processing means faster perceived performance
- **Reduced Frontend Bundle Size**: The complex Storacha client code runs server-side only
- **Better Security**: Sensitive delegation operations happen on the server
- **Streamlined Error Handling**: Provides unified error responses

## Limitations

- Uploads are limited by Next.js API route timeout and size limits
- For very large files, consider using the Storacha client directly in the frontend
- Server-side file processing may increase server load and bandwidth usage 