"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Lock, LockOpen, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { initLitClient } from "@/lib/litClient";
import { useAccount } from "wagmi";
import { useFileUpload } from "@/hooks/useFileUpload";
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
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [encryptionType, setEncryptionType] = useState<"public" | "private">("private");
  const [isLitInitialized, setIsLitInitialized] = useState(false);
  const [isLitInitializing, setIsLitInitializing] = useState(false);
  const [litError, setLitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get wallet connection status from wagmi
  const { address: connectedWallet, isConnected: isWalletConnected } = useAccount();

  // Use file upload hook
  const {
    uploadFileMutation,
    progress: uploadProgress,
    uploadedInfo,
    status: uploadStatus,
    handleReset: resetUpload,
  } = useFileUpload();

  // Initialize Lit Protocol client
  useEffect(() => {
    const initializeLit = async () => {
      if (isLitInitialized || isLitInitializing) return;
      
      setIsLitInitializing(true);
      setLitError(null);
      
      try {
        await initLitClient();
        setIsLitInitialized(true);
      } catch (err) {
        console.error("Failed to initialize Lit Protocol:", err);
        setLitError(err instanceof Error ? err.message : "Failed to initialize Lit Protocol");
      } finally {
        setIsLitInitializing(false);
      }
    };

    initializeLit();
  }, [isLitInitialized, isLitInitializing]);

  // Update result when upload completes
  useEffect(() => {
    if (uploadFileMutation.isSuccess && uploadedInfo) {
      setUploadResult({
        success: true,
        steps: [
          {
            step: 'encrypt',
            status: uploadedInfo.encrypted ? 'completed' : 'completed',
            message: uploadedInfo.encrypted 
              ? 'File encrypted with Lit Protocol (Balance > 0 required)'
              : 'File ready for upload',
          },
          {
            step: 'upload',
            status: uploadedInfo.pieceCid ? 'completed' : 'in_progress',
            message: uploadedInfo.pieceCid ? 'Uploaded to Filecoin' : 'Uploading to Filecoin...',
          },
        ],
        summary: {
          fileName: uploadedInfo.fileName || 'Unknown',
          fileSize: uploadedInfo.fileSize || 0,
          cid: uploadedInfo.pieceCid || '',
          entitiesCount: 0,
          relationshipsCount: 0,
          queriesExecuted: 0,
          isEncrypted: uploadedInfo.encrypted,
          encryptionType: uploadedInfo.encrypted ? 'private' : 'public',
        },
      });
    } else if (uploadFileMutation.isError) {
      setUploadResult({
        success: false,
        steps: [],
        error: uploadFileMutation.error instanceof Error 
          ? uploadFileMutation.error.message 
          : 'Upload failed',
      });
    }
  }, [uploadFileMutation.isSuccess, uploadFileMutation.isError, uploadedInfo, uploadFileMutation.error]);

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

    // Check Lit Protocol initialization for private encryption
    if (encryptionType === "private" && !isLitInitialized) {
      alert('Encryption system is still initializing. Please wait...');
      return;
    }

    // For private encryption, wallet must be connected
    if (encryptionType === "private" && !isWalletConnected) {
      alert('Please connect your wallet for private encryption.');
      return;
    }

    if (encryptionType === "private" && !connectedWallet) {
      alert('Wallet address not available. Please reconnect your wallet.');
      return;
    }

    // Reset previous results
    setUploadResult(null);
    resetUpload();

    // Trigger upload with encryption if private
    uploadFileMutation.mutate({
      file,
      encrypt: encryptionType === "private",
    });
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
          {!uploadFileMutation.isPending && !uploadResult && (
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
                    
                    {/* Lit Status */}
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
                            Only you (connected wallet with balance &gt; 0) can decrypt
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
                  disabled={!isLitInitialized || (encryptionType === "private" && !isWalletConnected)}
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

          {uploadFileMutation.isPending && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <div className="space-y-2">
                  <p className="text-muted-foreground flex items-center justify-center gap-2">
                    {uploadStatus.includes("Encrypt") && <Lock className="w-4 h-4" />}
                    {uploadStatus || "Processing your file..."}
                  </p>
                  {encryptionType === "private" && uploadStatus.includes("Encrypt") && (
                    <p className="text-xs text-muted-foreground">
                      Private encryption with balance check
                    </p>
                  )}
                </div>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {Math.round(uploadProgress)}% complete
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
                          <span className="text-muted-foreground">Piece CID:</span>
                          <div className="font-medium font-mono text-xs">
                            {uploadResult.summary.cid ? (
                              `${uploadResult.summary.cid.slice(0, 8)}...${uploadResult.summary.cid.slice(-8)}`
                            ) : (
                              "Processing..."
                            )}
                          </div>
                        </div>
                        {uploadedInfo?.txHash && (
                          <div>
                            <span className="text-muted-foreground">Transaction:</span>
                            <div className="font-medium font-mono text-xs">
                              {uploadedInfo.txHash.slice(0, 6)}...{uploadedInfo.txHash.slice(-4)}
                            </div>
                          </div>
                        )}
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
                                <> Only the authorized wallet with balance &gt; 0 can decrypt this file.</>
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
                    resetUpload();
                  }}
                  variant="outline"
                  className="flex-1 font-mono uppercase tracking-wider"
                >
                  Upload Another File
                </Button>
                <Button
                  onClick={() => {
                    setOpen(false);
                    setUploadResult(null);
                    resetUpload();
                  }}
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
