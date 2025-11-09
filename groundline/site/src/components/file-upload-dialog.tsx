"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Lock, LockOpen, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLitProtocol } from "@/hooks/useLitProtocol";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    isEncrypted?: boolean;
    encryptionType?: "public" | "private";
  };
  error?: string;
}

export function FileUploadDialog() {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [encryptionType, setEncryptionType] = useState<"public" | "private">("public");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isProcessingKG, setIsProcessingKG] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lit Protocol hook for encryption
  const { 
    isInitialized: isLitInitialized, 
    isInitializing: isLitInitializing,
    error: litError,
    isWalletConnected,
    connectedWallet,
    encryptFileData,
    initialize: initializeLit 
  } = useLitProtocol();

  // Initialize Lit Protocol only when private encryption is selected
  useEffect(() => {
    if (encryptionType === "private" && !isLitInitialized && !isLitInitializing) {
      initializeLit();
    }
  }, [encryptionType, isLitInitialized, isLitInitializing, initializeLit]);

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

    // For private encryption, check Lit Protocol initialization and wallet connection
    if (encryptionType === "private") {
      if (!isWalletConnected) {
        alert('Please connect your wallet for private encryption.');
        return;
      }
      
      if (!isLitInitialized) {
        if (isLitInitializing) {
          alert('Encryption system is still initializing. Please wait...');
        } else {
          // Try to initialize if not already initializing
          initializeLit();
          alert('Initializing encryption system. Please try again in a moment.');
        }
        return;
      }
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Step 1: Process knowledge graph BEFORE encryption
      setIsProcessingKG(true);
      const formData = new FormData();
      formData.append('file', file);

      const kgResponse = await fetch('http://localhost:3000/api/upload-and-process', {
        method: 'POST',
        body: formData,
      });

      if (!kgResponse.ok) {
        throw new Error(`Knowledge graph processing failed: ${kgResponse.statusText}`);
      }

      const kgResult = await kgResponse.json();
      
      // Filter out upload step from API response (we handle upload separately)
      // Keep only KG processing steps: parse, generate_queries, execute_queries
      const kgSteps = (kgResult.steps || []).filter(
        (step: ProcessingStep) => 
          step.step === 'parse' || 
          step.step === 'generate_queries' || 
          step.step === 'execute_queries' ||
          step.step === 'complete'
      );

      // Store KG result temporarily
      setUploadResult({
        success: true,
        steps: kgSteps,
        summary: {
          fileName: file.name,
          fileSize: file.size,
          cid: '',
          entitiesCount: kgResult.summary?.entitiesCount || 0,
          relationshipsCount: kgResult.summary?.relationshipsCount || 0,
          queriesExecuted: kgResult.summary?.queriesExecuted || 0,
          isEncrypted: encryptionType === "private",
          encryptionType: encryptionType,
        },
      });
      
      setIsProcessingKG(false);

      // Step 2: Read file content
      const fileContent = await file.text();

      // Step 3: Encrypt the file using Lit Protocol (only for private encryption)
      let encryptedFileData = null;
      if (encryptionType === "private") {
        setIsEncrypting(true);
        encryptedFileData = await encryptFileData(
          fileContent,
          file.name,
          file.size,
          encryptionType
        );
        setIsEncrypting(false);
      }

      // Step 4: Send data to API for upload
      const response = await fetch('http://localhost:3000/api/upload-and-process', {
        method: 'POST',
        headers: encryptionType === "private" 
          ? { 'Content-Type': 'application/json' }
          : undefined,
        body: encryptionType === "private"
          ? JSON.stringify({
              encryptedData: encryptedFileData,
              isEncrypted: true,
              originalContent: fileContent, // Include original content for processing
            })
          : (() => {
              const formData = new FormData();
              formData.append('file', file);
              return formData;
            })(),
      });

      const uploadResult = await response.json();
      
      // Merge upload steps with existing KG steps
      const uploadSteps = encryptionType === "private" ? [
        {
          step: 'encrypt',
          status: 'completed' as const,
          message: 'File encrypted with Lit Protocol',
        },
        {
          step: 'upload',
          status: 'completed' as const,
          message: 'Uploaded to Filecoin',
        },
      ] : [
        {
          step: 'upload',
          status: 'completed' as const,
          message: 'Uploaded to Filecoin',
        },
      ];

      // Update result with upload info
      setUploadResult((prev) => {
        if (!prev) {
          return {
            success: true,
            steps: uploadSteps,
            summary: uploadResult.summary || {
              fileName: file.name,
              fileSize: file.size,
              cid: '',
              entitiesCount: 0,
              relationshipsCount: 0,
              queriesExecuted: 0,
              isEncrypted: encryptionType === "private",
              encryptionType: encryptionType,
            },
          };
        }

        return {
          ...prev,
          steps: [...prev.steps, ...uploadSteps],
          summary: {
            ...prev.summary!,
            cid: uploadResult.summary?.cid || prev.summary?.cid || '',
            isEncrypted: encryptionType === "private",
            encryptionType: encryptionType,
          },
        };
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setIsUploading(false);
      setIsEncrypting(false);
      setIsProcessingKG(false);
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
      'encrypt': 'Encrypt with Lit Protocol',
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
        <Button className="px-6 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
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
            <>
              {/* Encryption Options */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="w-5 h-5 mt-0.5 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Lit Protocol Encryption</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your file will be encrypted using Lit Protocol before upload to Filecoin.
                    </p>
                    
                    {/* Lit Status - only show for private encryption */}
                    {encryptionType === "private" && (
                      <>
                        {isLitInitializing && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Initializing encryption system...
                          </div>
                        )}
                        
                        {litError && (
                          <div className="flex items-center gap-2 text-sm text-red-500 mb-3">
                            <AlertCircle className="w-4 h-4" />
                            {litError}
                          </div>
                        )}
                        
                        {isLitInitialized && (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-3">
                            <CheckCircle className="w-4 h-4" />
                            Encryption ready
                          </div>
                        )}
                      </>
                    )}

                    <RadioGroup 
                      value={encryptionType} 
                      onValueChange={(value) => setEncryptionType(value as "public" | "private")}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="public" id="public" />
                        <Label htmlFor="public" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <LockOpen className="w-4 h-4" />
                            <span className="font-medium">Public Access</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Anyone can decrypt and view the knowledge graph
                          </p>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span className="font-medium">Private Access</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Only you (connected wallet) can decrypt
                          </p>
                          {encryptionType === "private" && !isWalletConnected && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Connect wallet required
                            </p>
                          )}
                          {encryptionType === "private" && isWalletConnected && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
                              {connectedWallet?.slice(0, 6)}...{connectedWallet?.slice(-4)}
                            </p>
                          )}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </Card>

              {/* File Upload Area */}
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
                  className="mt-4 font-mono uppercase tracking-wider"
                  disabled={encryptionType === "private" && (!isLitInitialized || !isWalletConnected)}
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
            </>
          )}

          {isUploading && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                {isProcessingKG ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground flex items-center justify-center gap-2">
                      Processing knowledge graph...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Extracting entities and relationships...
                    </p>
                  </div>
                ) : isEncrypting ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      Encrypting file with Lit Protocol...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {encryptionType === "private" ? "Private encryption" : "Public encryption"}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Processing your file...</p>
                )}
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
                        {uploadResult.summary.isEncrypted && (
                          <div>
                            <span className="text-muted-foreground">Encryption:</span>
                            <div className="font-medium flex items-center gap-1">
                              {uploadResult.summary.encryptionType === "private" ? (
                                <>
                                  <Lock className="w-3 h-3" />
                                  Private
                                </>
                              ) : (
                                <>
                                  <LockOpen className="w-3 h-3" />
                                  Public
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Entities:</span>
                          <div className="font-medium">
                            {uploadResult.summary.isEncrypted ? "Encrypted" : uploadResult.summary.entitiesCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Relationships:</span>
                          <div className="font-medium">
                            {uploadResult.summary.isEncrypted ? "Encrypted" : uploadResult.summary.relationshipsCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Queries:</span>
                          <div className="font-medium">
                            {uploadResult.summary.isEncrypted ? "Skipped" : uploadResult.summary.queriesExecuted}
                          </div>
                        </div>
                      </div>
                      {uploadResult.summary.isEncrypted && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                          <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>
                              File encrypted with Lit Protocol. Knowledge graph extraction will occur when the file is decrypted.
                              {uploadResult.summary.encryptionType === "private" && (
                                <> Only the authorized wallet can decrypt this file.</>
                              )}
                            </span>
                          </p>
                        </div>
                      )}
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
                  className="flex-1 font-mono uppercase tracking-wider"
                >
                  Upload Another File
                </Button>
                <Button
                  onClick={() => setOpen(false)}
                  className="flex-1 font-mono uppercase tracking-wider"
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
