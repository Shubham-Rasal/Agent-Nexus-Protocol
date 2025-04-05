'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";
import { gmailSendTool } from '@/tools/gmail-send';
import { isGoogleAuthenticated, initiateGoogleAuth } from '@/services/googleAuth';
import { Loader2, Mail, Upload, List, CheckCircle, AlertCircle, X } from 'lucide-react';

export interface Recipient {
  name: string;
  email: string;
  company?: string;
  position?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient: Recipient;
  sentAt: Date;
}

export function EmailOutreachAgentCard() {
  // User data
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    company: '',
    position: '',
  });
  
  // Email content
  const [emailContent, setEmailContent] = useState({
    subject: '',
    body: '',
    cc: '',
  });
  
  // Recipients list
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newRecipient, setNewRecipient] = useState<Recipient>({
    name: '',
    email: '',
    company: '',
    position: '',
  });
  
  // Campaign settings
  const [objective, setObjective] = useState('');
  const [isPersonalized, setIsPersonalized] = useState(true);
  const [isHtml, setIsHtml] = useState(true);
  
  // Email sending state
  const [isSending, setIsSending] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [results, setResults] = useState<EmailResult[]>([]);
  
  // Generate template based on objective
  useEffect(() => {
    if (objective && userData.name && userData.company) {
      let subject = '';
      let body = '';
      
      // Create template based on objective keyword
      if (objective.toLowerCase().includes('demo') || objective.toLowerCase().includes('product')) {
        subject = `Would {name} be interested in a demo of ${userData.company}'s solution?`;
        body = `Hi {name},

I hope this email finds you well. My name is ${userData.name} from ${userData.company}, and I noticed {company} is doing great work in the industry.

Based on your role as {position}, I thought you might be interested in seeing how our solution could help with ${objective}.

Would you be open to a quick 15-minute demo this week to see if it's a good fit?

Best regards,
${userData.name}
${userData.position} | ${userData.company}`;
      } else if (objective.toLowerCase().includes('follow up') || objective.toLowerCase().includes('meeting')) {
        subject = `Follow-up: {company} and ${userData.company} collaboration`;
        body = `Hi {name},

I hope you're doing well. I'm reaching out to follow up on our previous conversation about ${objective}.

I'd love to schedule some time to discuss this further and explore how ${userData.company} can help {company} achieve its goals.

Are you available for a quick call this week?

Best regards,
${userData.name}
${userData.position} | ${userData.company}`;
      } else {
        subject = `${userData.company}: ${objective} - opportunity for {company}`;
        body = `Hi {name},

I hope this email finds you well. I'm ${userData.name} from ${userData.company}.

I'm reaching out because I believe we can help {company} with ${objective}. Based on your role as {position}, I thought you would be the right person to discuss this with.

Would you be open to a brief conversation about how we might work together?

Best regards,
${userData.name}
${userData.position} | ${userData.company}`;
      }
      
      setEmailContent({
        ...emailContent,
        subject,
        body,
      });
    }
  }, [objective, userData.name, userData.company, userData.position]);
  
  // Handle recipient management
  const handleAddRecipient = () => {
    if (!newRecipient.name || !newRecipient.email) {
      toast.error("Missing Information", {
        description: 'Please provide at least a name and email for the recipient.'
      });
      return;
    }
    
    setRecipients([...recipients, newRecipient]);
    setNewRecipient({
      name: '',
      email: '',
      company: '',
      position: '',
    });
  };
  
  const handleRemoveRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };
  
  // Import recipients from CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const nameIndex = headers.indexOf('name');
      const emailIndex = headers.indexOf('email');
      const companyIndex = headers.indexOf('company');
      const positionIndex = headers.indexOf('position');
      
      if (nameIndex === -1 || emailIndex === -1) {
        toast.error("Invalid CSV Format", {
          description: 'CSV file must contain at least "name" and "email" columns.'
        });
        return;
      }
      
      const importedRecipients: Recipient[] = [];
      
      // Start from 1 to skip headers
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        
        if (values[nameIndex] && values[emailIndex]) {
          importedRecipients.push({
            name: values[nameIndex],
            email: values[emailIndex],
            company: companyIndex !== -1 ? values[companyIndex] : undefined,
            position: positionIndex !== -1 ? values[positionIndex] : undefined,
          });
        }
      }
      
      if (importedRecipients.length > 0) {
        setRecipients([...recipients, ...importedRecipients]);
        toast.success("Recipients Imported", {
          description: `Successfully imported ${importedRecipients.length} recipients.`
        });
      } else {
        toast.error("No Valid Recipients", {
          description: 'No valid recipients were found in the CSV file.'
        });
      }
    };
    
    reader.readAsText(file);
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };
  
  // Handle sending a test email
  const handleTestEmail = async () => {
    if (!userData.name || !userData.email) {
      toast.error("Missing Information", {
        description: 'Please provide your name and email.'
      });
      return;
    }
    
    if (!emailContent.subject || !emailContent.body) {
      toast.error("Missing Content", {
        description: 'Please provide an email subject and body.'
      });
      return;
    }
    
    if (!isGoogleAuthenticated()) {
      toast.error("Not Authenticated", {
        description: 'Please connect your Gmail account first.'
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // Use the user's own email as the recipient for the test
      const result = await sendEmailToRecipient({
        name: userData.name,
        email: userData.email,
        company: userData.company,
        position: userData.position,
      });
      
      if (result.success) {
        toast.success("Test Email Sent", {
          description: 'The test email was sent successfully to your email address.'
        });
      } else {
        toast.error("Failed to Send Email", {
          description: result.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle sending email campaign
  const handleSendCampaign = async () => {
    if (!isGoogleAuthenticated()) {
      toast.error("Not Authenticated", {
        description: 'Please connect your Gmail account first.'
      });
      return;
    }
    
    if (recipients.length === 0) {
      toast.error("No Recipients", {
        description: 'Please add at least one recipient to your campaign.'
      });
      return;
    }
    
    setIsSending(true);
    setResults([]);
    setCurrentIndex(0);
    
    for (let i = 0; i < recipients.length; i++) {
      setCurrentIndex(i);
      const recipient = recipients[i];
      const result = await sendEmailToRecipient(recipient);
      setResults(prev => [...prev, result]);
      
      // Add a delay between emails to avoid rate limiting
      if (i < recipients.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    setIsSending(false);
    setCurrentIndex(-1);
    
    const successCount = results.filter(r => r.success).length;
    if (successCount === recipients.length) {
      toast.success("Campaign Completed", {
        description: `Sent ${recipients.length} emails, all successful.`
      });
    } else {
      toast.error("Campaign Completed with Errors", {
        description: `Sent ${recipients.length} emails, ${successCount} successful.`
      });
    }
  };
  
  // Send an email to a single recipient
  const sendEmailToRecipient = async (recipient: Recipient): Promise<EmailResult> => {
    try {
      // Personalize the content if enabled
      let finalSubject = emailContent.subject;
      let finalBody = emailContent.body;
      
      if (isPersonalized) {
        finalSubject = finalSubject
          .replace(/\{name\}/g, recipient.name)
          .replace(/\{company\}/g, recipient.company || 'your company')
          .replace(/\{position\}/g, recipient.position || 'your position');
        
        finalBody = finalBody
          .replace(/\{name\}/g, recipient.name)
          .replace(/\{company\}/g, recipient.company || 'your company')
          .replace(/\{position\}/g, recipient.position || 'your position');
      }
      
      // Add HTML formatting if enabled
      if (isHtml && !finalBody.includes('<html') && !finalBody.includes('<body')) {
        finalBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            ${finalBody.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}
          </div>
        `;
      }
      
      // Send the email
      const result = await gmailSendTool({
        to: recipient.email,
        subject: finalSubject,
        body: finalBody,
        cc: emailContent.cc,
      });
      
      return {
        ...result,
        recipient,
        sentAt: new Date(),
      };
    } catch (error) {
      console.error('Error sending email to recipient:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recipient,
        sentAt: new Date(),
      };
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-base">Email Outreach Agent</CardTitle>
        </div>
        <CardDescription>
          Send personalized email campaigns to your contacts
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue="compose">
          <TabsList className="grid grid-cols-3 w-full rounded-none">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose" className="px-4 py-3 space-y-4">
            {!isGoogleAuthenticated() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-xs font-medium text-yellow-800">Not connected to Gmail</p>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => initiateGoogleAuth()}
                >
                  Connect Gmail Account
                </Button>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="sidebar-name" className="text-xs">Your Name</Label>
                  <Input 
                    id="sidebar-name"
                    placeholder="John Doe" 
                    className="h-8 text-xs" 
                    value={userData.name}
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="sidebar-email" className="text-xs">Your Email</Label>
                  <Input 
                    id="sidebar-email"
                    placeholder="john@example.com" 
                    className="h-8 text-xs"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="sidebar-company" className="text-xs">Company</Label>
                  <Input 
                    id="sidebar-company"
                    placeholder="Acme Inc." 
                    className="h-8 text-xs"
                    value={userData.company}
                    onChange={(e) => setUserData({...userData, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="sidebar-position" className="text-xs">Position</Label>
                  <Input 
                    id="sidebar-position"
                    placeholder="Sales Manager" 
                    className="h-8 text-xs"
                    value={userData.position}
                    onChange={(e) => setUserData({...userData, position: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="sidebar-objective" className="text-xs">Outreach Objective</Label>
                <Textarea 
                  id="sidebar-objective"
                  placeholder="Schedule a demo call with prospects" 
                  className="min-h-[60px] text-xs" 
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="email-subject" className="text-xs">Email Subject</Label>
                <Input 
                  id="email-subject"
                  placeholder="Meeting Request: {company}" 
                  className="h-8 text-xs"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({...emailContent, subject: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="email-body" className="text-xs">Email Body</Label>
                <Textarea 
                  id="email-body"
                  placeholder="Write your email content here..."
                  className="min-h-[100px] text-xs" 
                  value={emailContent.body}
                  onChange={(e) => setEmailContent({...emailContent, body: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {'{name}'}, {'{company}'}, and {'{position}'} as placeholders.
                </p>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <Label htmlFor="email-cc" className="text-xs">CC (Optional)</Label>
                  <Input 
                    id="email-cc"
                    placeholder="cc@example.com" 
                    className="h-8 text-xs"
                    value={emailContent.cc}
                    onChange={(e) => setEmailContent({...emailContent, cc: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <Label htmlFor="personalize" className="text-xs cursor-pointer">Personalize Emails</Label>
                <Switch 
                  id="personalize" 
                  checked={isPersonalized}
                  onCheckedChange={setIsPersonalized}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="html-format" className="text-xs cursor-pointer">HTML Formatting</Label>
                <Switch 
                  id="html-format" 
                  checked={isHtml}
                  onCheckedChange={setIsHtml}
                />
              </div>
              
              <Button 
                className="w-full mt-2"
                onClick={handleTestEmail}
                disabled={isSending || !userData.email || !emailContent.subject || !emailContent.body || !isGoogleAuthenticated()}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : 'Send Test Email'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="recipients" className="px-4 py-3 space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium">Recipients ({recipients.length})</div>
              <div className="flex-1"></div>
              <input
                type="file"
                id="csv-upload"
                className="hidden"
                accept=".csv"
                onChange={handleImportCSV}
              />
              <label htmlFor="csv-upload">
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" asChild>
                  <span>
                    <Upload className="h-3 w-3" />
                    Import CSV
                  </span>
                </Button>
              </label>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="recipient-name" className="text-xs">Name</Label>
                  <Input 
                    id="recipient-name"
                    placeholder="Jane Doe" 
                    className="h-8 text-xs"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="recipient-email" className="text-xs">Email</Label>
                  <Input 
                    id="recipient-email"
                    placeholder="jane@example.com" 
                    className="h-8 text-xs"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="recipient-company" className="text-xs">Company (Optional)</Label>
                  <Input 
                    id="recipient-company"
                    placeholder="Company Name" 
                    className="h-8 text-xs"
                    value={newRecipient.company || ''}
                    onChange={(e) => setNewRecipient({...newRecipient, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="recipient-position" className="text-xs">Position (Optional)</Label>
                  <Input 
                    id="recipient-position"
                    placeholder="Position Title" 
                    className="h-8 text-xs"
                    value={newRecipient.position || ''}
                    onChange={(e) => setNewRecipient({...newRecipient, position: e.target.value})}
                  />
                </div>
              </div>
              
              <Button 
                size="sm" 
                className="w-full mt-1"
                onClick={handleAddRecipient}
                disabled={!newRecipient.name || !newRecipient.email}
              >
                Add Recipient
              </Button>
            </div>
            
            <Separator className="my-3" />
            
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {recipients.length > 0 ? (
                recipients.map((recipient, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between bg-gray-50 rounded-md p-2 text-xs"
                  >
                    <div>
                      <div className="font-medium">{recipient.name}</div>
                      <div className="text-gray-500">{recipient.email}</div>
                      {recipient.company && (
                        <div className="text-gray-400 text-[10px]">
                          {recipient.position} at {recipient.company}
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleRemoveRecipient(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-xs">
                  No recipients added yet
                </div>
              )}
            </div>
            
            <Button 
              className="w-full mt-2"
              onClick={handleSendCampaign}
              disabled={isSending || recipients.length === 0 || !isGoogleAuthenticated()}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending {currentIndex + 1} of {recipients.length}
                </>
              ) : `Send to ${recipients.length} Recipient${recipients.length !== 1 ? 's' : ''}`}
            </Button>
          </TabsContent>
          
          <TabsContent value="results" className="px-4 py-3">
            <div className="max-h-[300px] overflow-y-auto space-y-3">
              {results.length > 0 ? (
                results.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded-md text-xs ${result.success ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium">{result.recipient.name}</div>
                      <div className={`flex items-center ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                        {result.success ? 'Sent' : 'Failed'}
                      </div>
                    </div>
                    <div className="text-gray-500 mb-1">{result.recipient.email}</div>
                    {result.success ? (
                      <div className="text-green-700 text-[10px]">Message ID: {result.messageId}</div>
                    ) : (
                      <div className="text-red-700 text-[10px]">Error: {result.error}</div>
                    )}
                    <div className="text-gray-400 text-[10px] mt-1">
                      {result.sentAt.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">
                  No emails sent yet
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 