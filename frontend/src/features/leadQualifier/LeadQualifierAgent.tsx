'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Database, Loader2, Check, X, UserCheck, CircleDot } from 'lucide-react';

// Define type for the qualification result data
interface QualificationResultData {
  isQualified: boolean;
  hasEmail: boolean;
  hasLinkedIn: boolean;
  hasGitHub: boolean;
  recommendation: string;
}

export function LeadQualifierAgent() {
  // State for lead information
  const [email, setEmail] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [gitHub, setGitHub] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: QualificationResultData;
    error?: string;
  } | null>(null);

  // Sample leads for quick selection
  const sampleLeads = [
    { 
      label: 'John Smith',
      email: 'john.smith@example.com', 
      linkedIn: 'https://linkedin.com/in/johnsmith',
      gitHub: '',
    },
    { 
      label: 'Jane Doe',
      email: '', 
      linkedIn: 'https://linkedin.com/in/janedoe',
      gitHub: 'https://github.com/janedoe',
    },
    { 
      label: 'Bob Johnson',
      email: 'bob.johnson@example.com', 
      linkedIn: '',
      gitHub: '',
    },
  ];

  // Handle selecting a sample lead
  const selectSampleLead = (lead: typeof sampleLeads[0]) => {
    setEmail(lead.email);
    setLinkedIn(lead.linkedIn);
    setGitHub(lead.gitHub);
  };

  // Qualify lead using the server API route instead of direct tool call
  const qualifyLead = async () => {
    if (!email && !linkedIn && !gitHub) {
      toast.error('Missing Information', { description: 'Please provide at least one contact method for the lead.' });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Call the API route instead of the tool directly
      const response = await fetch('/api/agents/qualify-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadInfo: {
            email,
            linkedIn,
            gitHub
          }
        }),
      });

      const qualificationResult = await response.json();

      if (!response.ok) {
        throw new Error(qualificationResult.error || 'Failed to qualify lead');
      }

      if (!qualificationResult.success) {
        throw new Error(qualificationResult.error || 'Failed to qualify lead');
      }

      // Check if data exists and convert any unexpected types to proper booleans
      if (qualificationResult.data) {
        const processedData: QualificationResultData = {
          isQualified: !!qualificationResult.data.isQualified,
          hasEmail: !!qualificationResult.data.hasEmail,
          hasLinkedIn: !!qualificationResult.data.hasLinkedIn,
          hasGitHub: !!qualificationResult.data.hasGitHub,
          recommendation: qualificationResult.data.recommendation || ''
        };

        setResult({
          success: true,
          data: processedData
        });

        // Show toast based on qualification result
        if (processedData.isQualified) {
          toast.success('Lead Qualified', { description: 'This lead meets the qualification criteria.' });
        } else {
          toast.warning('Lead Not Qualified', { description: 'This lead does not meet the qualification criteria.' });
        }
      } else {
        throw new Error('No qualification data received');
      }
    } catch (error) {
      console.error('Error qualifying lead:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during lead qualification'
      });
      toast.error('Qualification Failed', { description: error instanceof Error ? error.message : 'Failed to qualify lead' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to reset the form
  const resetForm = () => {
    setEmail('');
    setLinkedIn('');
    setGitHub('');
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lead Information</CardTitle>
          <CardDescription>
            Enter lead contact information to qualify
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                placeholder="john.doe@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
              <Input 
                id="linkedin"
                placeholder="https://linkedin.com/in/johndoe" 
                value={linkedIn}
                onChange={(e) => setLinkedIn(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="github">GitHub Profile URL</Label>
              <Input 
                id="github"
                placeholder="https://github.com/johndoe" 
                value={gitHub}
                onChange={(e) => setGitHub(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Sample Leads</Label>
            <div className="grid grid-cols-1 gap-2">
              {sampleLeads.map((lead, index) => (
                <div 
                  key={index}
                  className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => selectSampleLead(lead)}
                >
                  <div className="font-medium">{lead.label}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-500">
                    {lead.email && (
                      <div>
                        <span className="font-medium">Email:</span> {lead.email}
                      </div>
                    )}
                    {lead.linkedIn && (
                      <div>
                        <span className="font-medium">LinkedIn:</span> {lead.linkedIn}
                      </div>
                    )}
                    {lead.gitHub && (
                      <div>
                        <span className="font-medium">GitHub:</span> {lead.gitHub}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1"
              onClick={qualifyLead}
              disabled={isProcessing || (!email && !linkedIn && !gitHub)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Qualify Lead
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Qualification Results</CardTitle>
              <div className="text-sm flex items-center gap-2">
                {result.success && result.data?.isQualified ? (
                  <>
                    <CircleDot className="h-4 w-4 text-green-500" />
                    <span className="text-green-700">Qualified</span>
                  </>
                ) : result.success ? (
                  <>
                    <CircleDot className="h-4 w-4 text-red-500" />
                    <span className="text-red-700">Not Qualified</span>
                  </>
                ) : (
                  <>
                    <CircleDot className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-700">Error</span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className={`border rounded-lg p-4 text-center ${result.data?.hasEmail ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="font-medium mb-2">Email</div>
                    {result.data?.hasEmail ? (
                      <Check className="h-6 w-6 mx-auto text-green-500" />
                    ) : (
                      <X className="h-6 w-6 mx-auto text-gray-400" />
                    )}
                  </div>
                  <div className={`border rounded-lg p-4 text-center ${result.data?.hasLinkedIn ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="font-medium mb-2">LinkedIn</div>
                    {result.data?.hasLinkedIn ? (
                      <Check className="h-6 w-6 mx-auto text-green-500" />
                    ) : (
                      <X className="h-6 w-6 mx-auto text-gray-400" />
                    )}
                  </div>
                  <div className={`border rounded-lg p-4 text-center ${result.data?.hasGitHub ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="font-medium mb-2">GitHub</div>
                    {result.data?.hasGitHub ? (
                      <Check className="h-6 w-6 mx-auto text-green-500" />
                    ) : (
                      <X className="h-6 w-6 mx-auto text-gray-400" />
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium mb-2">Recommendation:</div>
                  <p>{result.data?.recommendation}</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-medium text-red-800">Qualification Failed</p>
                <p className="text-red-700 mt-2">{result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 