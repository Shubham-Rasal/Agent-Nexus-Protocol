'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Database, Loader2, Check, X, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function LeadQualifierAgentCard() {
  // State for lead information
  const [email, setEmail] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [gitHub, setGitHub] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: {
      isQualified: boolean;
      hasEmail: boolean;
      hasLinkedIn: boolean;
      hasGitHub: boolean;
      recommendation: string;
    };
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

  // Implement the lead qualification logic from agent.js
  const qualifyLead = async () => {
    if (!email && !linkedIn && !gitHub) {
      toast.error('Missing Information', { description: 'Please provide at least one contact method for the lead.' });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // This is mimicking the leadQualificationTool function from agent.js
      const leadInfo = {
        email,
        linkedIn,
        gitHub
      };
      
      // Check if email, LinkedIn, or GitHub link is available
      const hasEmail = email && typeof email === 'string' && email.trim() !== '';
      const hasLinkedIn = linkedIn && typeof linkedIn === 'string' && linkedIn.trim() !== '';
      const hasGitHub = gitHub && typeof gitHub === 'string' && gitHub.trim() !== '';
      
      // Lead is qualified if any of the contact methods are available
      const isQualified = hasEmail || hasLinkedIn || hasGitHub;
      
      // Generate qualification details
      const qualificationDetails = [];
      if (hasEmail) qualificationDetails.push('Email available');
      if (hasLinkedIn) qualificationDetails.push('LinkedIn profile available');
      if (hasGitHub) qualificationDetails.push('GitHub profile available');
      
      // Generate recommendation based on qualification
      const recommendation = isQualified 
        ? `Lead is qualified with the following contact methods: ${qualificationDetails.join(', ')}.`
        : 'Lead is not qualified. No email, LinkedIn, or GitHub information provided.';
      
      setResult({
        success: true,
        data: {
          isQualified,
          hasEmail,
          hasLinkedIn,
          hasGitHub,
          recommendation
        }
      });

      // Show toast based on qualification result
      if (isQualified) {
        toast.success('Lead Qualified', { description: 'This lead meets the qualification criteria.' });
      } else {
        toast.warning('Lead Not Qualified', { description: 'This lead does not meet the qualification criteria.' });
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
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base">Lead Qualifier</CardTitle>
        </div>
        <CardDescription>
          Qualify leads based on available contact information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue="input">
          <TabsList className="grid grid-cols-2 w-full rounded-none">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="px-4 py-3 space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="email" className="text-xs">Email Address</Label>
                <Input 
                  id="email"
                  placeholder="john.doe@example.com" 
                  className="h-8 text-xs" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="linkedin" className="text-xs">LinkedIn Profile URL</Label>
                <Input 
                  id="linkedin"
                  placeholder="https://linkedin.com/in/johndoe" 
                  className="h-8 text-xs" 
                  value={linkedIn}
                  onChange={(e) => setLinkedIn(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="github" className="text-xs">GitHub Profile URL</Label>
                <Input 
                  id="github"
                  placeholder="https://github.com/johndoe" 
                  className="h-8 text-xs" 
                  value={gitHub}
                  onChange={(e) => setGitHub(e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-xs">Sample Leads</Label>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {sampleLeads.map((lead, index) => (
                    <div 
                      key={index}
                      className="text-xs p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => selectSampleLead(lead)}
                    >
                      <div className="font-medium">{lead.label}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lead.email && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">Email</Badge>
                        )}
                        {lead.linkedIn && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">LinkedIn</Badge>
                        )}
                        {lead.gitHub && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">GitHub</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1"
                  size="sm"
                  onClick={qualifyLead}
                  disabled={isProcessing || (!email && !linkedIn && !gitHub)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-3 w-3" />
                      Qualify Lead
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="w-24"
                >
                  Reset
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="px-4 py-3 space-y-4">
            {result ? (
              result.success ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {result.data?.isQualified ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-green-700">Qualified</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-700">Not Qualified</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium">Contact Methods:</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`border rounded p-2 text-center text-xs ${result.data?.hasEmail ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="font-medium mb-1">Email</div>
                        {result.data?.hasEmail ? (
                          <Check className="h-3 w-3 mx-auto text-green-500" />
                        ) : (
                          <X className="h-3 w-3 mx-auto text-gray-400" />
                        )}
                      </div>
                      <div className={`border rounded p-2 text-center text-xs ${result.data?.hasLinkedIn ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="font-medium mb-1">LinkedIn</div>
                        {result.data?.hasLinkedIn ? (
                          <Check className="h-3 w-3 mx-auto text-green-500" />
                        ) : (
                          <X className="h-3 w-3 mx-auto text-gray-400" />
                        )}
                      </div>
                      <div className={`border rounded p-2 text-center text-xs ${result.data?.hasGitHub ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="font-medium mb-1">GitHub</div>
                        {result.data?.hasGitHub ? (
                          <Check className="h-3 w-3 mx-auto text-green-500" />
                        ) : (
                          <X className="h-3 w-3 mx-auto text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md text-xs">
                    <div className="font-medium mb-1">Recommendation:</div>
                    <p>{result.data?.recommendation}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-xs text-red-800 font-medium">Qualification Failed</p>
                  <p className="text-xs text-red-700 mt-1">{result.error}</p>
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <Database className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No results yet</p>
                <p className="text-xs text-gray-400 mt-1">Fill the lead information to qualify</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 