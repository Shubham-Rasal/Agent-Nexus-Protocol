'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Database, CheckCircle, AlertCircle, Loader2, FileDown, FileText, FileIcon } from 'lucide-react';
import { executeTool } from '@/tools';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AkaveStorageToolProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  onTest?: (result: any) => void;
}

export default function AkaveStorageTool({ config, onChange, onTest }: AkaveStorageToolProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; data?: any } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Handle form field updates
  const updateField = (field: string, value: string) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  // Handle test operation
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setDownloadUrl(null);

    try {
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
    } catch (error) {
      setTestResult({
        success: false,
        error: String(error)
      });
    } finally {
      setIsTesting(false);
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
          onValueChange={(value) => updateField('operation', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">List Files</SelectItem>
            <SelectItem value="info">File Info</SelectItem>
            <SelectItem value="download">Download File</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
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
        disabled={isTesting || !config.bucketName || ((config.operation === 'info' || config.operation === 'download') && !config.fileName)}
        className="w-full"
      >
        {isTesting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            {config.operation === 'list' && <FileText className="mr-2 h-4 w-4" />}
            {config.operation === 'info' && <FileIcon className="mr-2 h-4 w-4" />}
            {config.operation === 'download' && <FileDown className="mr-2 h-4 w-4" />}
            Test {config.operation === 'list' ? 'List Files' : config.operation === 'info' ? 'Get File Info' : 'Download File'}
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
                    ? `Operation completed successfully.` 
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