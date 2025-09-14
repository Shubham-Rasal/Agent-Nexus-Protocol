'use client';

import { useState, useRef, useCallback } from 'react';
import { useAccount, useConnectorClient } from 'wagmi';
import { Synapse, RPC_URLS, CONTRACT_ADDRESSES } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SPRegistryService } from '@filoz/synapse-sdk/sp-registry'

import { 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Wallet,
  CreditCard,
  Database,
  ExternalLink
} from 'lucide-react';

interface UploadResult {
  pieceCid: string;
  size: number;
  pieceId?: number;
}

interface PreflightInfo {
  estimatedCost: {
    perEpoch: bigint;
    perDay: bigint;
    perMonth: bigint;
  };
  allowanceCheck: {
    sufficient: boolean;
    message?: string;
  };
}

export default function SynapseUploader() {
  // State management
  const [synapse, setSynapse] = useState<Synapse | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSettingUpPayments, setIsSettingUpPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // File management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [downloadedData, setDownloadedData] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Payment and preflight
  const [preflightInfo, setPreflightInfo] = useState<PreflightInfo | null>(null);
  const [depositAmount, setDepositAmount] = useState('10');
  const [rateAllowance, setRateAllowance] = useState('10');
  const [lockupAllowance, setLockupAllowance] = useState('1000');
  const [maxLockupPeriod, setMaxLockupPeriod] = useState('86400'); // 30 days in epochs
  
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: client } = useConnectorClient();

  // Convert wagmi client to ethers signer
  const getEthersSigner = useCallback(async () => {
    if (!client) return null;
    
    const provider = new ethers.BrowserProvider(client.transport);
    return await provider.getSigner();
  }, [client]);

  // Initialize Synapse SDK
  const initializeSynapse = useCallback(async () => {
    if (!isConnected || !client) {
      setError('Please connect your wallet first');
      return;
    }


    setIsInitializing(true);
    setError(null);

    try {
      const signer = await getEthersSigner();
      if (!signer) throw new Error('Failed to get signer');

      const synapseInstance = await Synapse.create({
        provider: signer.provider,
        rpcURL: RPC_URLS.calibration.websocket, // Use calibration testnet
  
      });

      setSynapse(synapseInstance);
      setSuccess('Synapse SDK initialized successfully!');
      

    } catch (err: any) {
      setError(`Failed to initialize Synapse: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  }, [isConnected, client, getEthersSigner]);

  // Run preflight check
  const runPreflightCheck = useCallback(async () => {
    if (!synapse || !selectedFile) {
      setError('Please initialize Synapse and select a file first');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      
      // Read the file into an in-memory buffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      // Create storage context and run preflight checks
      const storageContext = await synapse.createStorage({
        withCDN: true,
        callbacks: {
          onProviderSelected: (provider: any) => {
            console.log(`✓ Selected service provider: ${provider.serviceProvider}`);
          }
        }
      });
      const preflight = await storageContext.preflightUpload(fileData.length);
      setPreflightInfo(preflight);
      
      if (!preflight.allowanceCheck.sufficient) {
        // The Filecoin Services deal is not sufficient
        // You need to increase the allowance, e.g. via the web app
        const errorMessage = preflight.allowanceCheck.message || 
          `Insufficient allowances for upload`;
        setError(`Insufficient allowances: ${errorMessage}`);
        return;
      }
      
      setSuccess('Preflight check passed! You can proceed with upload.');
    } catch (err: any) {
      setError(`Preflight check failed: ${err.message}`);
    }
  }, [synapse, selectedFile]);

  // Setup payments (deposit and approve service)
  const setupPayments = useCallback(async () => {
    if (!synapse) {
      setError('Please initialize Synapse first');
      return;
    }

    setIsSettingUpPayments(true);
    setError(null);

    try {
      // 1. Deposit USDFC tokens
      const depositAmountWei = ethers.parseUnits(depositAmount, 18);
      setSuccess('Depositing USDFC tokens...');
      
      const depositTx = await synapse.payments.deposit(depositAmountWei);
      console.log(`Deposit transaction: ${depositTx.hash}`);
      await depositTx.wait();
      
      setSuccess('Deposit successful! Approving service...');

      // 2. Approve the Warm Storage service
      const warmStorageAddress = synapse.getPandoraAddress();
      const rateAllowanceWei = ethers.parseUnits(rateAllowance, 18);
      const lockupAllowanceWei = ethers.parseUnits(lockupAllowance, 18);
      const maxLockupPeriodBigInt = BigInt(maxLockupPeriod);

      const approveTx = await synapse.payments.approveService(
        warmStorageAddress,
        rateAllowanceWei,
        lockupAllowanceWei,
        maxLockupPeriodBigInt.toString()
      );
      
      console.log(`Service approval transaction: ${approveTx.hash}`);
      await approveTx.wait();
      
      setSuccess('Payment setup complete! You can now upload files.');
    } catch (err: any) {
      setError(`Payment setup failed: ${err.message}`);
    } finally {
      setIsSettingUpPayments(false);
    }
  }, [synapse, depositAmount, rateAllowance, lockupAllowance, maxLockupPeriod]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setError('Please select a JSON file');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setPreflightInfo(null); // Reset preflight when file changes
    }
  };

  // Upload file
  const uploadFile = useCallback(async () => {
    if (!synapse || !selectedFile) {
      setError('Please initialize Synapse and select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Read the file into an in-memory buffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      // Create storage context and run preflight checks
      const storageContext = await synapse.createStorage({
        withCDN: true,
        providerAddress:"https://calib.ezpdpz.net",
        callbacks: {
          onProviderSelected: (provider: any) => {
            console.log(`✓ Selected service provider: ${JSON.stringify(provider)}`);
          }
        }
      });
      const providerInfo = await storageContext.getProviderInfo();
      console.log(`✓ Provider info: ${JSON.stringify(providerInfo)}`);
      // const preflight = await storageContext.preflightUpload(fileData.length);
      
      // if (!preflight.allowanceCheck.sufficient) {
      //   const errorMessage = preflight.allowanceCheck.message || 
      //     `Insufficient allowances for upload`;
      //   setError(`Insufficient allowances: ${errorMessage}`);
      //   return;
      // }

      // Upload with progress callbacks
      const result = await storageContext.upload(fileData, {
        onUploadComplete: (commp: any) => {
          console.log(`Upload complete! PieceCID: ${commp}`);
        }
      });

      // Convert result to our interface
      const uploadResult: UploadResult = {
        pieceCid: result.commp?.toString() || 'unknown',
        size: result.size || fileData.length,
        pieceId: undefined
      };

      setUploadResults(prev => [...prev, uploadResult]);
      setSuccess(`File uploaded successfully! PieceCID: ${uploadResult.pieceCid}`);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }, [synapse, selectedFile]);

  // Download file
  const downloadFile = useCallback(async (pieceCid: string) => {
    if (!synapse) {
      setError('Please initialize Synapse first');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const data = await synapse.download(pieceCid);
      setDownloadedData(data);
      setSuccess(`File downloaded successfully! Size: ${data.length} bytes`);
    } catch (err: any) {
      setError(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  }, [synapse]);

  // Get account info
  const getAccountInfo = useCallback(async () => {
    if (!synapse) return;

    try {
      const info = await synapse.payments.accountInfo();
      console.log('Account info:', info);
      setSuccess(`Available balance: ${ethers.formatUnits(info.availableFunds, 18)} USDFC`);
    } catch (err: any) {
      setError(`Failed to get account info: ${err.message}`);
    }
  }, [synapse]);

  // Test storage provider selection
  const testStorageProvider = useCallback(async () => {
    if (!synapse) return;

    try {
      setError(null);
      setSuccess('Testing storage provider selection...');
      
      const storageContext = await synapse.createStorage({
        withCDN: true,
        providerAddress:"0xa3971A7234a3379A1813d9867B531e7EeB20ae07",
        callbacks: {
          onProviderSelected: (provider: any) => {
            console.log(`✓ Selected service provider: ${JSON.stringify(provider)}`);
            setSuccess(`Storage provider selected: ${JSON.stringify(provider)}`);
          }
        }
      });
      
      console.log(`Storage context created successfully: ${storageContext.getProofSetRoots()}`);
    } catch (err: any) {
      setError(`Failed to create storage context: ${err.message}`);
    }
  }, [synapse]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Synapse SDK File Uploader
          </CardTitle>
          <CardDescription>
            Upload JSON files to Filecoin using the Synapse SDK with MetaMask integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Connection Status */}
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="text-sm">
              {isConnected ? (
                <Badge variant="default">Connected: {address}</Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </span>
          </div>

          {/* Initialize Synapse */}
          <div className="space-y-2">
            <Label>Step 1: Initialize Synapse SDK</Label>
            <Button 
              onClick={initializeSynapse} 
              disabled={!isConnected || isInitializing}
              className="w-full"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Synapse
                </>
              )}
            </Button>
          </div>

          {synapse && (
            <>
              <Separator />
              
              {/* Payment Setup */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <Label>Step 2: Setup Payments</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="depositAmount">Deposit Amount (USDFC)</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rateAllowance">Rate Allowance (USDFC)</Label>
                    <Input
                      id="rateAllowance"
                      type="number"
                      value={rateAllowance}
                      onChange={(e) => setRateAllowance(e.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lockupAllowance">Lockup Allowance (USDFC)</Label>
                    <Input
                      id="lockupAllowance"
                      type="number"
                      value={lockupAllowance}
                      onChange={(e) => setLockupAllowance(e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLockupPeriod">Max Lockup Period (epochs)</Label>
                    <Input
                      id="maxLockupPeriod"
                      type="number"
                      value={maxLockupPeriod}
                      onChange={(e) => setMaxLockupPeriod(e.target.value)}
                      placeholder="86400"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={setupPayments} 
                    disabled={isSettingUpPayments}
                    variant="outline"
                  >
                    {isSettingUpPayments ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up payments...
                      </>
                    ) : (
                      'Setup Payments'
                    )}
                  </Button>
                  <Button 
                    onClick={getAccountInfo} 
                    variant="outline"
                  >
                    Check Balance
                  </Button>
                  <Button 
                    onClick={testStorageProvider} 
                    variant="outline"
                  >
                    Test Storage Provider
                  </Button>
                </div>
              </div>

              <Separator />

              {/* File Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <Label>Step 3: Upload JSON File</Label>
                </div>

                <div className="space-y-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="w-full"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={runPreflightCheck} 
                      variant="outline"
                    >
                      Run Preflight Check
                    </Button>
                    <Button 
                      onClick={uploadFile} 
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload File
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Preflight Results */}
                {preflightInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Preflight Check Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs">Cost per Epoch</Label>
                          <p className="font-mono">{ethers.formatUnits(preflightInfo.estimatedCost.perEpoch, 18)} USDFC</p>
                        </div>
                        <div>
                          <Label className="text-xs">Cost per Day</Label>
                          <p className="font-mono">{ethers.formatUnits(preflightInfo.estimatedCost.perDay, 18)} USDFC</p>
                        </div>
                        <div>
                          <Label className="text-xs">Cost per Month</Label>
                          <p className="font-mono">{ethers.formatUnits(preflightInfo.estimatedCost.perMonth, 18)} USDFC</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Allowance Check:</Label>
                          {preflightInfo.allowanceCheck.sufficient ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Sufficient
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Insufficient
                            </Badge>
                          )}
                        </div>
                        {preflightInfo.allowanceCheck.message && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {preflightInfo.allowanceCheck.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />

              {/* Upload Results */}
              {uploadResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Label>Upload Results</Label>
                  </div>
                  
                  <div className="space-y-2">
                    {uploadResults.map((result, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-mono break-all">
                                PieceCID: {result.pieceCid}
                              </p>
                              <p className="text-xs text-gray-500">
                                Size: {(result.size / 1024).toFixed(2)} KB
                                {result.pieceId && ` | Piece ID: ${result.pieceId}`}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(result.pieceCid)}
                              disabled={isDownloading}
                            >
                              {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Downloaded Data */}
              {downloadedData && (
                <div className="space-y-2">
                  <Label>Downloaded Data Preview</Label>
                  <Card>
                    <CardContent className="p-4">
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {new TextDecoder().decode(downloadedData)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
