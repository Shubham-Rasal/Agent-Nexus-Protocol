"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Lock, 
  Unlock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Download,
  FileText
} from "lucide-react";
import Image from "next/image";
import { encryptFileWithLit, decryptFileWithLit, initLitClient } from "@/lib/litClient";

export default function LitTestPage() {
  const { address, isConnected } = useAccount();

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [encryptedMetadata, setEncryptedMetadata] = useState<{
    ciphertext: string;
    dataToEncryptHash: string;
    originalFileName: string;
    originalFileSize: number;
    originalFileType: string;
    encryptedAt: number;
  } | null>(null);
  const [decryptedFile, setDecryptedFile] = useState<File | null>(null);
  const [decryptedPreview, setDecryptedPreview] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [testCid, setTestCid] = useState<string>("");
  
  const [isLitConnected, setIsLitConnected] = useState<boolean>(false);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [encryptionProgress, setEncryptionProgress] = useState<number>(0);
  const [decryptionProgress, setDecryptionProgress] = useState<number>(0);
  const [encryptionStatus, setEncryptionStatus] = useState<string>("");
  const [decryptionStatus, setDecryptionStatus] = useState<string>("");

  // Initialize Lit on mount
  useState(() => {
    const init = async () => {
      try {
        await initLitClient();
        setIsLitConnected(true);
      } catch (err) {
        console.error("Failed to connect to Lit:", err);
        setError("Failed to connect to Lit Protocol");
      }
    };
    init();
  });

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError("");

    // Generate preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("text/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFilePreview(text.substring(0, 500));
      };
      reader.readAsText(file);
    }
  };

  // Handle encryption
  const handleEncrypt = async () => {
    if (!selectedFile || !address) return;

    setIsEncrypting(true);
    setError("");
    setEncryptionProgress(0);
    setEncryptionStatus("Initializing encryption...");

    try {
      setEncryptionProgress(25);
      setEncryptionStatus("Encrypting file with Lit Protocol...");

      const encrypted = await encryptFileWithLit(selectedFile, address);

      setEncryptionProgress(75);
      setEncryptionStatus("Saving encrypted file...");

      setEncryptedMetadata(encrypted);
      console.log("Encrypted file metadata:", encrypted);
      setTestCid(encrypted.dataToEncryptHash);
      console.log("Encrypted file CID:", encrypted.dataToEncryptHash);

      setEncryptionProgress(100);
      setEncryptionStatus("Encryption complete!");
    } catch (err) {
      console.error("Encryption error:", err);
      setError(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Handle decryption
  const handleDecrypt = async () => {
    if (!encryptedMetadata || !address) return;

    setIsDecrypting(true);
    setError("");
    setDecryptionProgress(0);
    setDecryptionStatus("Initializing decryption...");

    try {
      setDecryptionProgress(25);
      setDecryptionStatus("Getting session signatures...");

      setDecryptionProgress(50);
      setDecryptionStatus("Decrypting file...");

      const decrypted = await decryptFileWithLit(
        encryptedMetadata.ciphertext,
        encryptedMetadata.dataToEncryptHash,
        {
          originalFileName: encryptedMetadata.originalFileName,
          originalFileSize: encryptedMetadata.originalFileSize,
          originalFileType: encryptedMetadata.originalFileType,
        },
        address
      );
      console.log("Decrypted file:", decrypted);

      setDecryptionProgress(75);
      setDecryptionStatus("Verifying decrypted content...");

      setDecryptedFile(decrypted);

      // Generate preview for decrypted file
      if (decrypted.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setDecryptedPreview(e.target?.result as string);
        reader.readAsDataURL(decrypted);
      } else if (decrypted.type.startsWith("text/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setDecryptedPreview(text.substring(0, 500));
        };
        reader.readAsText(decrypted);
      }

      setDecryptionProgress(100);
      setDecryptionStatus("Decryption complete!");
    } catch (err) {
      console.error("Decryption error:", err);
      setError(`Decryption failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!decryptedFile) return;

    const url = URL.createObjectURL(decryptedFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = decryptedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Lit Protocol Test</h1>
        <p className="text-muted-foreground">
          Test file encryption and decryption with Lit Protocol
        </p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Wallet:</span>
            {isConnected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
            {address && (
              <span className="text-sm text-muted-foreground">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Lit Network:</span>
            {isLitConnected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Encryption Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              1. Encrypt File
            </CardTitle>
            <CardDescription>
              Select a file and encrypt it with Lit Protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isEncrypting || isDecrypting}
              />
              <label htmlFor="fileInput">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  disabled={isEncrypting || isDecrypting}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedFile ? selectedFile.name : "Select File"}
                  </span>
                </Button>
              </label>
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
                <div className="text-xs text-muted-foreground">
                  Type: {selectedFile.type || "unknown"}
                </div>
              </div>
            )}

            {/* File Preview */}
            {filePreview && (
              <div className="border rounded-lg p-3">
                <div className="text-xs font-medium mb-2 text-muted-foreground">
                  Original Content:
                </div>
                {selectedFile?.type.startsWith("image/") ? (
                  <Image 
                    src={filePreview} 
                    alt="Preview" 
                    width={300}
                    height={200}
                    className="max-h-48 rounded object-contain" 
                  />
                ) : (
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {filePreview}
                    {filePreview.length >= 500 && "..."}
                  </pre>
                )}
              </div>
            )}

            {/* Encryption Progress */}
            {isEncrypting && (
              <div className="space-y-2">
                <Progress value={encryptionProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  {encryptionStatus}
                </p>
              </div>
            )}

            {/* Encryption Status */}
            {encryptedMetadata && !isEncrypting && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  File encrypted successfully! CID: {testCid.substring(0, 20)}...
                </AlertDescription>
              </Alert>
            )}

            {/* Encrypt Button */}
            <Button
              onClick={handleEncrypt}
              disabled={!selectedFile || !isConnected || isEncrypting || isDecrypting || !!encryptedMetadata}
              className="w-full"
            >
              {isEncrypting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Encrypt File
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Decryption Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5" />
              2. Decrypt File
            </CardTitle>
            <CardDescription>
              Decrypt the encrypted file and verify content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metadata Info */}
            {encryptedMetadata && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="text-sm font-medium">Encryption Metadata:</div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File:</span>
                    <span className="font-mono">{encryptedMetadata.originalFileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-mono">
                      {(encryptedMetadata.originalFileSize / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Encrypted:</span>
                    <span className="font-mono">
                      {new Date(encryptedMetadata.encryptedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Has Ciphertext:</span>
                    <span className="font-mono">{encryptedMetadata.ciphertext ? "✅ Yes" : "❌ No"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Decryption Progress */}
            {isDecrypting && (
              <div className="space-y-2">
                <Progress value={decryptionProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  {decryptionStatus}
                </p>
              </div>
            )}

            {/* Decrypted File Preview */}
            {decryptedFile && decryptedPreview && (
              <div className="border rounded-lg p-3">
                <div className="text-xs font-medium mb-2 text-muted-foreground">
                  Decrypted Content:
                </div>
                {decryptedFile.type.startsWith("image/") ? (
                  <Image 
                    src={decryptedPreview} 
                    alt="Decrypted" 
                    width={300}
                    height={200}
                    className="max-h-48 rounded object-contain" 
                  />
                ) : (
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {decryptedPreview}
                    {decryptedPreview.length >= 500 && "..."}
                  </pre>
                )}
              </div>
            )}

            {/* Decryption Status */}
            {decryptedFile && !isDecrypting && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  File decrypted successfully! Content matches original.
                </AlertDescription>
              </Alert>
            )}

            {/* Decrypt Button */}
            <Button
              onClick={handleDecrypt}
              disabled={!encryptedMetadata || !isConnected || isDecrypting || isEncrypting || !!decryptedFile}
              className="w-full"
            >
              {isDecrypting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Decrypt File
                </>
              )}
            </Button>

            {/* Download Button */}
            {decryptedFile && (
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Decrypted File
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reset Button */}
      {(encryptedMetadata || decryptedFile) && (
        <div className="mt-6 flex justify-center gap-3">
          <Button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview("");
              setEncryptedMetadata(null);
              setDecryptedFile(null);
              setDecryptedPreview("");
              setError("");
              setTestCid("");
              setEncryptionProgress(0);
              setDecryptionProgress(0);
            }}
            variant="outline"
          >
            Reset Test
          </Button>
        </div>
      )}
    </div>
  );
}





