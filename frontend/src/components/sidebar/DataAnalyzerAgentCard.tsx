'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FileSpreadsheet, FileDown, Loader2, Database, PieChart, CircleDot } from 'lucide-react';
import { csvProcessorTool } from '@/tools/csv-processor';
import { akaveStorageTool } from '@/tools/akave-storage';

export function DataAnalyzerAgentCard() {
  // State for data source 
  const [dataSource, setDataSource] = useState('');
  const [instructions, setInstructions] = useState('');
  const [outputFormat, setOutputFormat] = useState<'csv' | 'json'>('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: string;
    error?: string;
  } | null>(null);

  // Sample datasets for quick selection
  const sampleDatasets = [
    { 
      label: 'Sales Data', 
      url: 'https://raw.githubusercontent.com/datasets/sample-data/main/sales-data.csv',
      description: 'Sample sales data with regions, products, and quarterly figures'
    },
    { 
      label: 'COVID-19 Data', 
      url: 'https://raw.githubusercontent.com/datasets/covid-19/main/data/countries-aggregated.csv',
      description: 'COVID-19 cases by country over time'
    },
    { 
      label: 'Population Data', 
      url: 'https://raw.githubusercontent.com/datasets/population/main/data/population.csv',
      description: 'World population figures by country and year'
    },
  ];

  // Analysis templates
  const analysisTemplates = [
    {
      id: 'summary',
      label: 'Data Summary',
      instructions: `Analyze this CSV data and provide a summary with:
1. Total number of rows and columns
2. Summary statistics for numerical columns
3. Top 5 values and their counts for categorical columns
4. Any missing data or quality issues detected`,
    },
    {
      id: 'trends',
      label: 'Find Trends',
      instructions: `Identify key trends in this dataset:
1. Calculate growth rates between time periods
2. Identify seasonal patterns if applicable
3. Find correlations between different columns
4. List the top 3 most significant trends`,
    },
    {
      id: 'insights',
      label: 'Business Insights',
      instructions: `Extract business insights from this data:
1. Calculate key performance indicators
2. Identify top performing segments
3. Find underperforming areas
4. Provide 3 actionable recommendations based on the data`,
    }
  ];

  // Handle selecting a sample dataset
  const selectSampleDataset = (url: string) => {
    setDataSource(url);
  };

  // Handle selecting an analysis template
  const selectAnalysisTemplate = (template: string) => {
    const selectedTemplate = analysisTemplates.find(t => t.id === template);
    if (selectedTemplate) {
      setInstructions(selectedTemplate.instructions);
    }
  };

  // Process the data
  const analyzeData = async () => {
    if (!dataSource) {
      toast.error('Missing Data Source', { description: 'Please provide a URL to a CSV file to analyze.' });
      return;
    }

    if (!instructions) {
      toast.error('Missing Instructions', { description: 'Please provide instructions for how to analyze the data.' });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const result = await csvProcessorTool({
        inputUrl: dataSource,
        systemPrompt: instructions,
        outputFormat,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to process data');
      }

      let displayData = '';
      if (typeof result.data === 'string') {
        displayData = result.data;
      } else {
        displayData = outputFormat === 'json' 
          ? JSON.stringify(result.data, null, 2)
          : String(result.data);
      }

      // Trim if too long for display
      if (displayData.length > 2000) {
        displayData = displayData.substring(0, 2000) + '...\n(Result truncated for display)';
      }

      setResult({
        success: true,
        data: displayData
      });

      toast.success('Analysis Complete', { description: 'Data analysis completed successfully' });
    } catch (error) {
      console.error('Error analyzing data:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      toast.error('Analysis Failed', { description: error instanceof Error ? error.message : 'Failed to analyze data' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Download results
  const downloadResults = () => {
    if (!result?.success || !result.data) return;

    const blob = new Blob([result.data], { 
      type: outputFormat === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-results.${outputFormat}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-base">Data Analyzer</CardTitle>
        </div>
        <CardDescription>
          Analyze CSV data with natural language instructions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue="input">
          <TabsList className="grid grid-cols-3 w-full rounded-none">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="analyze">Analyze</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="px-4 py-3 space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="data-source" className="text-xs">CSV Data URL</Label>
                <Input 
                  id="data-source"
                  placeholder="https://example.com/data.csv" 
                  className="h-8 text-xs" 
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-xs">Sample Datasets</Label>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {sampleDatasets.map((dataset, index) => (
                    <div 
                      key={index}
                      className="text-xs p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => selectSampleDataset(dataset.url)}
                    >
                      <div className="font-medium">{dataset.label}</div>
                      <div className="text-gray-500 text-[10px] mt-1 truncate">{dataset.url}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analyze" className="px-4 py-3 space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="instructions" className="text-xs">Analysis Instructions</Label>
                  <Select onValueChange={selectAnalysisTemplate}>
                    <SelectTrigger className="w-[130px] h-7 text-xs">
                      <SelectValue placeholder="Templates" />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id} className="text-xs">
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea 
                  id="instructions"
                  placeholder="Describe what you want to know from this data..." 
                  className="min-h-[100px] text-xs mt-1" 
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Output Format</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="format-csv"
                      checked={outputFormat === 'csv'}
                      onChange={() => setOutputFormat('csv')}
                      className="h-3 w-3"
                    />
                    <label htmlFor="format-csv" className="text-xs">CSV</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="format-json"
                      checked={outputFormat === 'json'}
                      onChange={() => setOutputFormat('json')}
                      className="h-3 w-3"
                    />
                    <label htmlFor="format-json" className="text-xs">JSON</label>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full mt-2"
                size="sm"
                onClick={analyzeData}
                disabled={isProcessing || !dataSource || !instructions}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <PieChart className="mr-2 h-3 w-3" />
                    Analyze Data
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="px-4 py-3 space-y-4">
            {result ? (
              result.success ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium flex items-center gap-1">
                      <CircleDot className="h-3 w-3 text-green-500" />
                      Analysis Complete
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={downloadResults}
                    >
                      <FileDown className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-[200px]">
                    <pre className="whitespace-pre-wrap">{result.data}</pre>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-xs text-red-800 font-medium">Analysis Failed</p>
                  <p className="text-xs text-red-700 mt-1">{result.error}</p>
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <Database className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No results yet</p>
                <p className="text-xs text-gray-400 mt-1">Use the Analyze tab to process data</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 