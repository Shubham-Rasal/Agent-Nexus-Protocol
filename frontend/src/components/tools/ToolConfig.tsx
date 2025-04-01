'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import GmailSendTool from './GmailSendTool';
import AkaveStorageTool from './AkaveStorageTool';
import GoogleCalendarTool from './GoogleCalendarTool';
import CSVProcessorTool from './CSVProcessorTool';

interface ToolConfigProps {
  toolId: string;
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export default function ToolConfig({ toolId, config, onChange }: ToolConfigProps) {
  const [error, setError] = useState<string | null>(null);
  
  // Clear any errors when the tool changes
  useEffect(() => {
    setError(null);
  }, [toolId]);
  
  // Handle test results
  const handleTestResult = (result: any) => {
    if (!result.success && result.error) {
      setError(result.error);
    } else {
      setError(null);
    }
  };
  
  // Render the appropriate tool configuration UI based on toolId
  const renderToolConfig = () => {
    switch (toolId) {
      case 'gmail-send':
        return (
          <GmailSendTool 
            config={config}
            onChange={onChange}
            onTest={handleTestResult}
          />
        );
      case 'akave-storage':
        return (
          <AkaveStorageTool
            config={config}
            onChange={onChange}
            onTest={handleTestResult}
          />
        );
      case 'google-calendar':
        return (
          <GoogleCalendarTool
            config={config}
            onChange={onChange}
            onTest={handleTestResult}
          />
        );
      case 'csv-processor':
        return (
          <CSVProcessorTool
            config={config}
            onChange={onChange}
            onTest={handleTestResult}
          />
        );
      // Add more tool cases here as they are implemented
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            <p>Configuration for this tool is not available.</p>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Card className="bg-rose-50 border-rose-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
              <p className="text-sm text-rose-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {renderToolConfig()}
    </div>
  );
} 