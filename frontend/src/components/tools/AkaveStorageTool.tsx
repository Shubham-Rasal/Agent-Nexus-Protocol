'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Database, CheckCircle, AlertCircle, Loader2, FileDown, 
  FileText, FileIcon, Upload, FileUp, FolderPlus 
} from 'lucide-react';
import { executeTool } from '@/tools';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AkaveStorageToolProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  onTest?: (result: any) => void;
}

export default function AkaveStorageTool({ config, onChange, onTest }: AkaveStorageToolProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; data?: any } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle form field updates
  const updateField = (field: string, value: string | boolean) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  // Handle file selection for upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedFile(file);
    
    if (file) {
      // Set the fileName field to the uploaded file's name
      updateField('fileName', file.name);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle test operation
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setDownloadUrl(null);

    try {
      // For upload operations, we need to prepare the file data
      if (config.operation === 'upload' && uploadedFile) {
        setIsUploading(true);
        
        // Convert file to base64
        const base64Data = await fileToBase64(uploadedFile);
        
        const result = await executeTool('akave-storage', {
          bucketName: config.bucketName || '',
          operation: 'upload',
          fileName: config.fileName || uploadedFile.name,
          fileData: base64Data,
          fileType: uploadedFile.type,
          createBucket: config.createBucket || false
        });
        
        setTestResult(result);
        
        if (onTest) {
          onTest(result);
        }
        
        setIsUploading(false);
      } else {
        // For other operations, proceed as before
        const result = await executeTool('akave-storage', {
          bucketName: config.bucketName || '',
          operation: config.operation || 'list',
          fileName: config.fileName || undefined
        });

        setTestResult(result);
        
        // If it's a download operation and successful, set the download URL
        if (result.success && config.operation === 'download' && result.data?.downloadUrl) {
          setDownloadUrl(result.data.downloadUrl);
        }
        
        if (onTest) {
          onTest(result);
        }
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: String(error)
      });
    } finally {
      setIsTesting(false);
      setIsUploading(false);
    }
  };

  // Handle file download
  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = config.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    }
  };
  
  // Reset file selection
  const handleResetFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bucketName">Bucket Name</Label>
        <Input
          id="bucketName"
          placeholder="myBucket"
          value={config.bucketName || ''}
          onChange={(e) => updateField('bucketName', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="operation">Operation</Label>
        <Select 
          value={config.operation || 'list'} 
          onValueChange={(value) => {
            updateField('operation', value);
            // Reset file selection when changing operation
            if (value !== 'upload') {
              handleResetFile();
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">List Files</SelectItem>
            <SelectItem value="info">File Info</SelectItem>
            <SelectItem value="download">Download File</SelectItem>
            <SelectItem value="upload">Upload File</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Upload specific UI */}
      {config.operation === 'upload' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              placeholder="myFile.txt"
              value={config.fileName || ''}
              onChange={(e) => updateField('fileName', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fileUpload">Upload File</Label>
            <div className="border rounded-md p-4 bg-gray-50">
              <input
                ref={fileInputRef}
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={handleFileChange}
              />
              
              {!uploadedFile ? (
                <div className="text-center py-6">
                  <FileUp className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2"
                  >
                    Select File
                  </Button>
                  <p className="text-xs text-gray-500">Supported file types: Any</p>
                </div>
              ) : (
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleResetFile}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox 
              id="createBucket" 
              checked={config.createBucket || false}
              onCheckedChange={(checked) => updateField('createBucket', Boolean(checked))}
            />
            <Label htmlFor="createBucket" className="text-sm">
              Create bucket if it doesn't exist
            </Label>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            <FolderPlus className="h-3 w-3 inline-block mr-1" />
            If checked, the system will create the bucket if it doesn't already exist
          </p>
        </>
      )}
      
      {/* Info and Download specific UI */}
      {(config.operation === 'info' || config.operation === 'download') && (
        <div className="space-y-2">
          <Label htmlFor="fileName">File Name</Label>
          <Input
            id="fileName"
            placeholder="myFile.txt"
            value={config.fileName || ''}
            onChange={(e) => updateField('fileName', e.target.value)}
          />
        </div>
      )}
      
      <Button 
        onClick={handleTest} 
        disabled={
          isTesting || 
          !config.bucketName || 
          ((config.operation === 'info' || config.operation === 'download') && !config.fileName) ||
          (config.operation === 'upload' && !uploadedFile)
        }
        className="w-full"
      >
        {isTesting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isUploading ? 'Uploading...' : 'Testing...'}
          </>
        ) : (
          <>
            {config.operation === 'list' && <FileText className="mr-2 h-4 w-4" />}
            {config.operation === 'info' && <FileIcon className="mr-2 h-4 w-4" />}
            {config.operation === 'download' && <FileDown className="mr-2 h-4 w-4" />}
            {config.operation === 'upload' && <Upload className="mr-2 h-4 w-4" />}
            {config.operation === 'upload' ? 'Upload File' : 
              config.operation === 'list' ? 'List Files' : 
              config.operation === 'info' ? 'Get File Info' : 'Download File'}
          </>
        )}
      </Button>
      
      {testResult && (
        <Card className={`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-rose-800'} mb-2`}>
                  {testResult.success 
                    ? `${config.operation === 'upload' ? 'File uploaded successfully!' : 'Operation completed successfully.'}`
                    : `Operation failed: ${testResult.error}`}
                </p>
                
                {testResult.success && testResult.data && (
                  <div>
                    {config.operation === 'list' && (
                      <div className="bg-white p-2 rounded border border-green-200 text-xs overflow-auto max-h-60">
                        <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                      </div>
                    )}
                    
                    {config.operation === 'info' && (
                      <div className="bg-white p-2 rounded border border-green-200 text-xs overflow-auto max-h-60">
                        <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                      </div>
                    )}
                    
                    {config.operation === 'upload' && (
                      <div className="bg-white p-2 rounded border border-green-200 text-xs overflow-auto max-h-60">
                        <div className="flex items-center gap-2 mb-2">
                          <FileIcon className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{testResult.data.fileName}</span>
                        </div>
                        <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                      </div>
                    )}
                    
                    {config.operation === 'download' && downloadUrl && (
                      <Button size="sm" onClick={handleDownload} variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Download {config.fileName}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 