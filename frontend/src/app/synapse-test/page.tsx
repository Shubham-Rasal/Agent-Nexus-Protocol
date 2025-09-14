'use client';

import  SynapseUploader  from '@/components/SynapseUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ExternalLink } from 'lucide-react';

export default function SynapseTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Synapse SDK Test Component
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Test uploading JSON files to Filecoin using the Synapse SDK with MetaMask integration.
            This component demonstrates the complete workflow from wallet connection to file upload and download.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="text-sm space-y-1">
                <li>• MetaMask wallet connected</li>
                <li>• Filecoin Calibration testnet configured</li>
                <li>• USDFC tokens for payments</li>
                <li>• JSON file to upload</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Testnet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <p><strong>Network:</strong> Filecoin Calibration</p>
                <p><strong>Chain ID:</strong> 314159</p>
                <p><strong>RPC:</strong> wss://wss.calibration.node.glif.io</p>
                <p><strong>USDFC Contract:</strong> 0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How to use:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Connect your MetaMask wallet (make sure you're on Filecoin Calibration testnet)</li>
              <li>Initialize the Synapse SDK</li>
              <li>Setup payments by depositing USDFC and approving the service</li>
              <li>Select a JSON file and run a preflight check</li>
              <li>Upload your file to Filecoin storage</li>
              <li>Test downloading the file using its PieceCID</li>
            </ol>
            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm">
                <strong>Need a test file?</strong> Download our sample JSON file: 
                <a 
                  href="/sample-data.json" 
                  download="sample-data.json"
                  className="ml-1 text-blue-600 hover:text-blue-800 underline"
                >
                  sample-data.json
                </a>
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Main Component */}
        <SynapseUploader />

        {/* Additional Resources */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SDK Documentation</CardTitle>
              <CardDescription>
                Learn more about the Synapse SDK
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="https://github.com/FilOzone/synapse-sdk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                View on GitHub <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filecoin Testnet</CardTitle>
              <CardDescription>
                Get testnet tokens and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="https://faucet.calibration.fildev.network/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                Calibration Faucet <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">MetaMask Setup</CardTitle>
              <CardDescription>
                Configure MetaMask for Filecoin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="https://docs.filecoin.io/basics/assets/metamask-setup" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                Setup Guide <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
