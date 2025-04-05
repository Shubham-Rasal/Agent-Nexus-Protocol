'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { gmailSendTool } from '@/tools/gmail-send';
import { isGoogleAuthenticated, initiateGoogleAuth } from '@/services/googleAuth';
import { Loader2, Mail, AlertCircle, CheckCircle, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import { extractEmailData } from '@/lib/llm-client';

interface ExtractedData {
  name: string;
  email: string;
  company?: string;
  position?: string;
  objective?: string;
  content?: string;
}

export function AgentTester() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'extracting' | 'generating' | 'sending'>('idle');
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  // Generate email content based on extracted data
  const generateEmailContent = (data: ExtractedData) => {
    // Default to a general outreach template if no objective is specified
    const objective = data.objective || 'connect and explore potential collaboration';
    
    // Set up the sender information
    const senderName = 'Shubham Rasal'; // Replace with actual user info or get from profile
    const senderCompany = 'Maximal Studios';
    const senderPosition = 'Recruiter';
    
    // Generate email subject and body
    let subject = '';
    let body = '';
    
    if (objective.toLowerCase().includes('demo') || objective.toLowerCase().includes('product')) {
      subject = `Demo request: ${senderCompany}'s solution for ${data.company || 'your company'}`;
      body = `Hi ${data.name},

I hope this email finds you well. My name is ${senderName} from ${senderCompany}, and I noticed ${data.company || 'your company'} is doing great work in the industry.

Based on your role as ${data.position || 'a professional in your field'}, I thought you might be interested in seeing how our solution could help with ${objective}.

${data.content || 'Would you be open to a quick 15-minute demo this week to see if it\'s a good fit?'}

Best regards,
${senderName}
${senderPosition} | ${senderCompany}`;
    } else if (objective.toLowerCase().includes('follow up') || objective.toLowerCase().includes('meeting')) {
      subject = `Follow-up: ${data.company || 'our'} and ${senderCompany} collaboration`;
      body = `Hi ${data.name},

I hope you're doing well. I'm reaching out to follow up on our previous conversation about ${objective}.

${data.content || 'I\'d love to schedule some time to discuss this further and explore how we can help your team achieve its goals.'}

Are you available for a quick call this week?

Best regards,
${senderName}
${senderPosition} | ${senderCompany}`;
    } else {
      subject = `${senderCompany}: ${objective} - opportunity for ${data.company || 'your company'}`;
      body = `Hi ${data.name},

I hope this email finds you well. I'm ${senderName} from ${senderCompany}.

I'm reaching out because I believe we can help ${data.company || 'your company'} with ${objective}. ${data.position ? `Based on your role as ${data.position}, I thought you would be the right person to discuss this with.` : ''}

${data.content || 'Would you be open to a brief conversation about how we might work together?'}

Best regards,
${senderName}
${senderPosition} | ${senderCompany}`;
    }
    
    return { subject, body };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim()) {
      toast.error("Empty Input", { description: "Please enter some information about who you want to email." });
      return;
    }
    
    if (!isGoogleAuthenticated()) {
      toast.error("Not Authenticated", { description: "Please connect your Gmail account first." });
      initiateGoogleAuth();
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      // Step 1: Extract data using Lilypad LLM
      setProcessingStep('extracting');
      const response = await extractEmailData(inputText);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to extract data from input');
      }
      
      const data = response.data;
      setExtractedData(data);
      
      // Validate the extracted data
      if (!data.email || !data.name) {
        throw new Error('Could not extract a valid email address and name from your input.');
      }
      
      // Step 2: Generate email content
      setProcessingStep('generating');
      const emailContent = generateEmailContent(data);
      
      // Step 3: Send the email
      setProcessingStep('sending');
      const result = await gmailSendTool({
        to: data.email,
        subject: emailContent.subject,
        body: emailContent.body,
      });
      
      if (result.success) {
        setResult({
          success: true,
          message: `Email successfully sent to ${data.name} at ${data.email}`,
        });
        toast.success("Email Sent", { description: `Your email to ${data.name} was sent successfully.` });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error in test flow:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      toast.error("Error", { description: error instanceof Error ? error.message : 'Failed to process your request.' });
    } finally {
      setLoading(false);
      setProcessingStep('idle');
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Test Agent</CardTitle>
        <CardDescription>
          Describe a recipient and we'll analyze the text to extract contact info and send an email
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Describe who you want to email. Include their name, email, company, position, and what you want to discuss. For example: 'Send an email to John Smith (john@example.com) at Acme Corp. He's the CTO and I want to schedule a demo of our product.'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[100px]"
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processingStep === 'extracting' && 'Analyzing text...'}
                {processingStep === 'generating' && 'Generating email...'}
                {processingStep === 'sending' && 'Sending email...'}
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Process and Send Email
              </>
            )}
          </Button>
        </form>
        
        {loading && processingStep === 'extracting' && (
          <div className="mt-4 p-3 border border-blue-100 rounded-md bg-blue-50 text-sm">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-blue-500 animate-pulse" />
              <p className="text-blue-700">
                Using LLM to analyze and extract contact information...
              </p>
            </div>
          </div>
        )}
        
        {result && (
          <div className={`mt-4 p-3 rounded-md text-sm ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2">
              {result.success ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                <AlertCircle className="h-4 w-4 text-red-500" />
              }
              <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </p>
            </div>
          </div>
        )}
        
        {extractedData && result?.success && (
          <div className="mt-4 p-3 text-sm border border-gray-200 rounded-md bg-gray-50">
            <h4 className="font-medium mb-2">Extracted Information:</h4>
            <ul className="space-y-1 text-gray-600">
              <li><span className="font-medium">Name:</span> {extractedData.name}</li>
              <li><span className="font-medium">Email:</span> {extractedData.email}</li>
              {extractedData.company && <li><span className="font-medium">Company:</span> {extractedData.company}</li>}
              {extractedData.position && <li><span className="font-medium">Position:</span> {extractedData.position}</li>}
              {extractedData.objective && <li><span className="font-medium">Objective:</span> {extractedData.objective}</li>}
              {extractedData.content && <li><span className="font-medium">Additional Content:</span> {extractedData.content}</li>}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 