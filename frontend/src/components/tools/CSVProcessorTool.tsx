'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  FileJson,
  Code
} from 'lucide-react';
import { executeTool } from '@/tools';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Models available in Lilypad - updated to match the models in route.ts
const AVAILABLE_MODELS = [
  { id: 'llama3.1:8b', name: 'Llama 3.1 (8B)' },
  { id: 'llama3.1:70b', name: 'Llama 3.1 (70B)' },
  { id: 'mixtral:8x7b', name: 'Mixtral 8x7B' },
  { id: 'mistral:7b', name: 'Mistral 7B' },
  { id: 'gemma:7b', name: 'Gemma 7B' }
];

interface CSVProcessorToolProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  onTest?: (result: any) => void;
}

export default function CSVProcessorTool({ config, onChange, onTest }: CSVProcessorToolProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; data?: any; outputUrl?: string } | null>(null);
  const [outputPreview, setOutputPreview] = useState<string | null>(null);

  // Handle form field updates
  const updateField = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  // Handle test operation
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setOutputPreview(null);

    try {
      const result = await executeTool('csv-processor', {
        inputUrl: config.inputUrl || '',
        systemPrompt: config.systemPrompt || '',
        outputFormat: config.outputFormat || 'csv',
        maxRows: parseInt(config.maxRows || '1000'),
        model: config.model || 'llama3.1:8b'
      });

      setTestResult(result);
      
      // Prepare preview data for display
      if (result.success && result.data) {
        let preview;
        if (typeof result.data === 'string') {
          // For CSV output
          preview = result.data.split('\n').slice(0, 10).join('\n');
        } else {
          // For JSON output
          preview = JSON.stringify(result.data.slice(0, 10), null, 2);
        }
        setOutputPreview(preview);
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
    if (testResult?.outputUrl) {
      const a = document.createElement('a');
      a.href = testResult.outputUrl;
      
      // Set the file name with the appropriate extension
      const fileExtension = config.outputFormat === 'json' ? '.json' : '.csv';
      a.download = `transformed_data${fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(testResult.outputUrl);
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inputUrl">CSV Input URL</Label>
        <Input
          id="inputUrl"
          placeholder="https://example.com/data.csv"
          value={config.inputUrl || ''}
          onChange={(e) => updateField('inputUrl', e.target.value)}
        />
        <p className="text-xs text-gray-500">
          URL to a publicly accessible CSV file that needs to be processed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">Transformation Instructions</Label>
        <Textarea
          id="systemPrompt"
          placeholder="Describe how you want the CSV data to be transformed..."
          value={config.systemPrompt || ''}
          onChange={(e) => updateField('systemPrompt', e.target.value)}
          rows={5}
          className="resize-y"
        />
        <p className="text-xs text-gray-500">
          <Code className="h-3 w-3 inline-block mr-1" />
          Instructions for how the LLM should transform the CSV data (e.g., "Combine the first and last name columns into a full_name column")
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="outputFormat">Output Format</Label>
          <Select
            value={config.outputFormat || 'csv'}
            onValueChange={(value) => updateField('outputFormat', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select output format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxRows">Max Rows</Label>
          <Input
            id="maxRows"
            type="number"
            placeholder="1000"
            min="1"
            max="10000"
            value={config.maxRows || '1000'}
            onChange={(e) => updateField('maxRows', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">LLM Model</Label>
        <Select
          value={config.model || 'llama3.1:8b'}
          onValueChange={(value) => updateField('model', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select LLM model" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MODELS.map(model => (
              <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          The Lilypad LLM model to use for transforming the data
        </p>
      </div>

      <Button
        onClick={handleTest}
        disabled={isTesting || !config.inputUrl || !config.systemPrompt}
        className="w-full"
      >
        {isTesting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing CSV Data...
          </>
        ) : (
          <>
            {config.outputFormat === 'json' ? <FileJson className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
            Transform CSV Data
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
                    ? 'CSV data transformed successfully!'
                    : `Error: ${testResult.error}`}
                </p>

                {testResult.success && outputPreview && (
                  <>
                    <div className="mt-3 mb-2">
                      <p className="text-sm font-medium text-gray-700">Preview (first 10 rows):</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-green-200 text-xs overflow-auto max-h-60 font-mono">
                      <pre>{outputPreview}</pre>
                    </div>
                    
                    {testResult.outputUrl && (
                      <Button size="sm" onClick={handleDownload} variant="outline" className="mt-4">
                        <FileDown className="mr-2 h-4 w-4" />
                        Download {config.outputFormat === 'json' ? 'JSON' : 'CSV'} Result
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 