'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { csvProcessorTool } from '@/tools/csv-processor';
import { akaveStorageTool } from '@/tools/akave-storage';
import { Loader2, FileSpreadsheet, Database, UploadCloud, FileDown, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';

// Define types for our agent
export interface DataAnalyzerAgentProps {
  onCompletion?: (result: AnalysisResult) => void;
}

interface AnalysisRequestData {
  inputUrl: string;
  instructions: string;
  outputFormat: 'csv' | 'json';
  saveToBucket: boolean;
  bucketName: string;
  fileName: string;
}

export interface AnalysisResult {
  success: boolean;
  error?: string;
  data?: any;
  downloadUrl?: string;
  storageInfo?: {
    bucketName: string;
    fileName: string;
  };
}

export const DataAnalyzerAgent = ({ onCompletion }: DataAnalyzerAgentProps) => {
  // State for input parameters
  const [requestData, setRequestData] = useState<AnalysisRequestData>({
    inputUrl: '',
    instructions: '',
    outputFormat: 'csv',
    saveToBucket: false,
    bucketName: 'data-analysis',
    fileName: `analysis-${new Date().toISOString().slice(0, 10)}.csv`,
  });

  // State for processing status
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'loading' | 'processing' | 'storing' | 'complete'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [buckets, setBuckets] = useState<string[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  
  // Load available buckets
  const loadBuckets = async () => {
    try {
      setLoadingBuckets(true);
      // Try to list buckets or files from a known bucket to see what's available
      const response = await akaveStorageTool({
        bucketName: 'data-analysis',
        operation: 'list'
      });
      
      if (response.success) {
        setBuckets(['data-analysis']);
      } else {
        setBuckets([]);
      }
    } catch (error) {
      console.error('Error loading buckets:', error);
      setBuckets([]);
    } finally {
      setLoadingBuckets(false);
    }
  };

  // Handle form field updates
  const updateField = (field: keyof AnalysisRequestData, value: any) => {
    setRequestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle file extension based on output format
  const updateOutputFormat = (format: 'csv' | 'json') => {
    updateField('outputFormat', format);
    
    // Update file extension in the filename
    const nameWithoutExt = requestData.fileName.split('.')[0];
    updateField('fileName', `${nameWithoutExt}.${format}`);
  };

  // Process the data analysis request
  const processDataAnalysis = async () => {
    if (!requestData.inputUrl) {
      toast.error('Missing Data Source', { description: 'Please provide a URL to a CSV file to analyze.' });
      return;
    }

    if (!requestData.instructions) {
      toast.error('Missing Instructions', { description: 'Please provide instructions for how to analyze the data.' });
      return;
    }

    setIsProcessing(true);
    setProcessingStep('loading');
    setResult(null);

    try {
      // Step 1: Process the CSV data
      setProcessingStep('processing');
      
      const csvResult = await csvProcessorTool({
        inputUrl: requestData.inputUrl,
        systemPrompt: requestData.instructions,
        outputFormat: requestData.outputFormat,
      });

      if (!csvResult.success) {
        throw new Error(csvResult.error || 'Failed to process CSV data');
      }

      // Step 2: Store in Akave if requested
      let storageResult = null;
      
      if (requestData.saveToBucket) {
        setProcessingStep('storing');
        
        // First convert the data to a string if it's not already
        let fileData;
        if (typeof csvResult.data === 'string') {
          fileData = csvResult.data;
        } else {
          fileData = requestData.outputFormat === 'json' 
            ? JSON.stringify(csvResult.data, null, 2)
            : csvResult.data;
        }
        
        // Convert to base64 for storage
        const base64Data = btoa(unescape(encodeURIComponent(fileData)));
        
        // Determine content type
        const contentType = requestData.outputFormat === 'json' 
          ? 'application/json'
          : 'text/csv';
        
        // Upload to Akave storage
        storageResult = await akaveStorageTool({
          bucketName: requestData.bucketName,
          operation: 'upload',
          fileName: requestData.fileName,
          fileData: base64Data,
          fileType: contentType,
          createBucket: true,
        });
        
        if (!storageResult.success) {
          console.error('Storage warning:', storageResult.error);
          toast.warning('Storage Warning', { 
            description: 'Analysis completed but failed to save to storage: ' + storageResult.error 
          });
        }
      }

      // Set the final result
      const finalResult: AnalysisResult = {
        success: true,
        data: csvResult.data,
        downloadUrl: csvResult.outputUrl,
        ...(storageResult?.success && {
          storageInfo: {
            bucketName: requestData.bucketName,
            fileName: requestData.fileName,
          }
        })
      };
      
      setResult(finalResult);
      setProcessingStep('complete');
      
      // Call the completion callback if provided
      if (onCompletion) {
        onCompletion(finalResult);
      }
      
      toast.success('Analysis Complete', { 
        description: `Data analysis completed successfully${storageResult?.success ? ' and saved to storage' : ''}` 
      });
    } catch (error) {
      console.error('Error processing data analysis:', error);
      
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      
      toast.error('Analysis Failed', { 
        description: error instanceof Error ? error.message : 'Failed to analyze data' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Create a downloadable link for the data
  const createDownloadLink = (data: any, format: 'csv' | 'json', filename: string) => {
    // Convert data to the appropriate format if needed
    let content;
    let mimeType;
    
    if (format === 'json') {
      content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    } else {
      content = typeof data === 'string' ? data : data;
      mimeType = 'text/csv';
    }
    
    // Create blob and download link
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    window.URL.revokeObjectURL(url);
  };

  // Handle download click
  const handleDownload = () => {
    if (result?.success && result.data) {
      createDownloadLink(
        result.data, 
        requestData.outputFormat, 
        requestData.fileName
      );
    }
  };

  // Generate example instructions based on selected template
  const setInstructionTemplate = (templateId: string) => {
    let instructions = '';
    
    switch (templateId) {
      case 'summary':
        instructions = `Please analyze this CSV data and provide a summary with the following:
1. Total number of rows and columns in the dataset
2. Statistical summary (min, max, mean, median) for all numerical columns
3. Count of unique values for categorical columns
4. Identify any missing values or potential data quality issues
5. Create a new column with insights about the most important patterns

Return the summary as a structured table with clear headers.`;
        break;
        
      case 'filter':
        instructions = `Filter this dataset to include only rows where:
1. [specify your filtering condition]
2. [specify another condition if needed]

Then sort the results by [specify column] in [ascending/descending] order.
Keep only the following columns in the output: [list columns to keep]`;
        break;
        
      case 'transform':
        instructions = `Transform this dataset by:
1. Normalizing all numeric columns to a 0-1 scale
2. Converting categorical variables to one-hot encoding
3. Creating a new column that calculates [describe calculation]
4. Removing outliers (values more than 3 standard deviations from the mean)
5. Imputing missing values with the column median

Return the transformed dataset with the same structure but improved values.`;
        break;
        
      case 'visualization':
        instructions = `Analyze this dataset and create a visualization-ready JSON with the following:
1. Aggregate the data to show [specify aggregation]
2. Calculate growth rates between time periods
3. Identify the top 5 [categories/items] by [metric]
4. Prepare a structure suitable for a time series chart
5. Include trend indicators (up/down/unchanged) for each data point

Format the output as JSON with clear hierarchy and labels.`;
        break;
    }
    
    updateField('instructions', instructions);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            <span>Data Source</span>
          </CardTitle>
          <CardDescription>
            Provide a URL to a CSV file that you want to analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvUrl">CSV File URL</Label>
            <Input
              id="csvUrl"
              placeholder="https://example.com/data.csv"
              value={requestData.inputUrl}
              onChange={(e) => updateField('inputUrl', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The CSV file should be publicly accessible via this URL
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-purple-500" />
            <span>Analysis Instructions</span>
          </CardTitle>
          <CardDescription>
            Describe how you want the data to be analyzed in natural language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="instructions">Instructions</Label>
              <Select onValueChange={setInstructionTemplate}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Data Summary</SelectItem>
                  <SelectItem value="filter">Filter & Sort</SelectItem>
                  <SelectItem value="transform">Transform Data</SelectItem>
                  <SelectItem value="visualization">Visualization Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              id="instructions"
              placeholder="Analyze this data to show the total sales by region, sorted from highest to lowest. Calculate growth rate from previous year..."
              value={requestData.instructions}
              onChange={(e) => updateField('instructions', e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          <Separator className="my-2" />

          <div className="space-y-2">
            <Label htmlFor="outputFormat">Output Format</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="formatCsv"
                  checked={requestData.outputFormat === 'csv'}
                  onChange={() => updateOutputFormat('csv')}
                />
                <label htmlFor="formatCsv">CSV</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="formatJson"
                  checked={requestData.outputFormat === 'json'}
                  onChange={() => updateOutputFormat('json')}
                />
                <label htmlFor="formatJson">JSON</label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-500" />
            <span>Storage Settings</span>
          </CardTitle>
          <CardDescription>
            Configure how to save your analysis results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="saveToBucket" className="cursor-pointer">Save to decentralized storage</Label>
            <Switch
              id="saveToBucket"
              checked={requestData.saveToBucket}
              onCheckedChange={(checked) => updateField('saveToBucket', checked)}
            />
          </div>

          {requestData.saveToBucket && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="bucketName">Bucket Name</Label>
                <Input
                  id="bucketName"
                  placeholder="analysis-results"
                  value={requestData.bucketName}
                  onChange={(e) => updateField('bucketName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  placeholder={`analysis-${new Date().toISOString().slice(0, 10)}.${requestData.outputFormat}`}
                  value={requestData.fileName}
                  onChange={(e) => updateField('fileName', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button 
        className="w-full"
        size="lg"
        onClick={processDataAnalysis}
        disabled={isProcessing || !requestData.inputUrl || !requestData.instructions}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {processingStep === 'loading' && 'Loading data...'}
            {processingStep === 'processing' && 'Analyzing data...'}
            {processingStep === 'storing' && 'Saving results...'}
          </>
        ) : (
          <>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Analyze Data
          </>
        )}
      </Button>

      {result && (
        <Card className={result.success ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <FileDown className="h-5 w-5 text-green-500" />
                  <span>Analysis Results</span>
                </>
              ) : (
                <>
                  <FileQuestion className="h-5 w-5 text-red-500" />
                  <span>Analysis Failed</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">
                    Your analysis is complete! The data has been processed according to your instructions.
                  </p>
                  {result.storageInfo && (
                    <p className="text-sm mt-2">
                      Results saved to {result.storageInfo.bucketName}/{result.storageInfo.fileName}
                    </p>
                  )}
                </div>
                
                <Button onClick={handleDownload} className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  Download Results
                </Button>

                {typeof result.data === 'string' && (
                  <div className="bg-gray-50 p-3 rounded-md overflow-auto max-h-[300px]">
                    <pre className="text-xs whitespace-pre-wrap">{result.data}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 p-3 rounded-md">
                <p className="text-sm text-red-800">
                  {result.error || 'An unknown error occurred during analysis.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataAnalyzerAgent; 