'use client';
import { useState, useRef } from 'react';

export default function StorachaUploader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ cid: string, url: string, files: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!fileInputRef.current?.files?.length) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      // Create a FormData object and append all selected files
      const formData = new FormData();
      Array.from(fileInputRef.current.files).forEach(file => {
        formData.append('files', file);
      });
      
      // Upload files to our simplified API endpoint
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
      
      console.log('Upload successful!', result);
      setUploadResult({
        cid: result.cid,
        url: result.url,
        files: result.files
      });
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An unknown error occurred during upload');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <h2 className="text-xl font-bold mb-4">Storacha Upload</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Files
        </label>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={isLoading}
        className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? 'Uploading...' : 'Upload to Storacha'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {uploadResult && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <p><strong>Upload Successful!</strong></p>
          <p className="mt-2">
            <strong>Files uploaded:</strong> {uploadResult.files.join(', ')}
          </p>
          <p className="mt-2">
            <strong>CID:</strong> <span className="font-mono text-sm">{uploadResult.cid}</span>
          </p>
          <p className="mt-1">
            <strong>URL:</strong>{' '}
            <a
              href={uploadResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline font-mono text-sm"
            >
              {uploadResult.url}
            </a>
          </p>
        </div>
      )}
    </div>
  );
} 