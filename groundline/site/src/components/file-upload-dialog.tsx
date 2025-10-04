"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  data?: any;
}

interface UploadResult {
  success: boolean;
  steps: ProcessingStep[];
  summary?: {
    fileName: string;
    fileSize: number;
    cid: string;
    entitiesCount: number;
    relationshipsCount: number;
    queriesExecuted: number;
  };
  error?: string;
}

export function FileUploadDialog() {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['text/markdown', 'text/plain', 'text/mdx'];
    const allowedExtensions = ['.md', '.txt', '.mdx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Invalid file type. Only markdown (.md) and text (.txt) files are allowed.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-and-process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setUploadResult(result);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStepName = (step: string) => {
    const stepNames: Record<string, string> = {
      'upload': 'Upload to Filecoin',
      'parse': 'Extract Knowledge Graph',
      'generate_queries': 'Generate Cypher Queries',
      'execute_queries': 'Store in Memgraph',
      'complete': 'Processing Complete'
    };
    return stepNames[step] || step;
  };

  const progress = uploadResult?.steps 
    ? (uploadResult.steps.filter(s => s.status === 'completed').length / uploadResult.steps.length) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Upload & Process File</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isUploading && !uploadResult && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                  : "border-muted-foreground/30 hover:border-muted-foreground/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Upload Markdown or Text File</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supported formats: .md, .txt, .mdx (max 10MB)
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-4"
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.mdx,text/markdown,text/plain"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {isUploading && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Processing your file...</p>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {uploadResult && (
            <div className="space-y-4">
              {uploadResult.success ? (
                <>
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-green-700 dark:text-green-400">
                      Processing Complete!
                    </h3>
                  </div>

                  {uploadResult.summary && (
                    <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <h4 className="font-medium mb-3">Processing Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">File:</span>
                          <div className="font-medium">{uploadResult.summary.fileName}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Size:</span>
                          <div className="font-medium">
                            {(uploadResult.summary.fileSize / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CID:</span>
                          <div className="font-medium font-mono text-xs">
                            {uploadResult.summary.cid.slice(0, 8)}...{uploadResult.summary.cid.slice(-8)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Entities:</span>
                          <div className="font-medium">{uploadResult.summary.entitiesCount}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Relationships:</span>
                          <div className="font-medium">{uploadResult.summary.relationshipsCount}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Queries:</span>
                          <div className="font-medium">{uploadResult.summary.queriesExecuted}</div>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium">Processing Steps</h4>
                    {uploadResult.steps.map((step, index) => (
                      <div key={step.step} className="flex items-center gap-3 p-3 rounded-lg border">
                        {getStepIcon(step)}
                        <div className="flex-1">
                          <div className="font-medium">{getStepName(step.step)}</div>
                          {step.message && (
                            <div className="text-sm text-muted-foreground">{step.message}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-red-700 dark:text-red-400">
                    Processing Failed
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {uploadResult.error || 'An error occurred during processing'}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setUploadResult(null);
                    setIsUploading(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Upload Another File
                </Button>
                <Button
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
