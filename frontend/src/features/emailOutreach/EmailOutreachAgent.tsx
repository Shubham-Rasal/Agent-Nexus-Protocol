'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { gmailSendTool } from '@/tools/gmail-send';
import { isGoogleAuthenticated, initiateGoogleAuth } from '@/services/googleAuth';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Define the types for our agent
export interface EmailOutreachAgentProps {
  userData: {
    name: string;
    email: string;
    company: string;
    position: string;
  };
  objective: string;
  isPersonalized: boolean;
  isHtml: boolean;
  onCompletion?: (result: EmailResult) => void;
}

export interface Recipient {
  name: string;
  email: string;
  company?: string;
  position?: string;
  customFields?: Record<string, string>;
}

export interface EmailContent {
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient: Recipient;
  sentAt: Date;
}

export const EmailOutreachAgent = ({
  userData,
  objective,
  isPersonalized = true,
  isHtml = true,
  onCompletion,
}: EmailOutreachAgentProps) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [emailContent, setEmailContent] = useState<EmailContent>({
    subject: '',
    body: '',
  });
  const [newRecipient, setNewRecipient] = useState<Recipient>({
    name: '',
    email: '',
    company: '',
    position: '',
  });
  const [results, setResults] = useState<EmailResult[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Initialize with a sample email template based on the objective
  useEffect(() => {
    if (objective) {
      let subject = '';
      let body = '';

      // Generate email content based on the objective
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
        subject,
        body,
      });
    }
  }, [objective, userData]);

  // Handle adding a new recipient
  const handleAddRecipient = () => {
    if (!newRecipient.name || !newRecipient.email) {
      toast.error('Please provide at least a name and email for the recipient.');
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

  // Handle removing a recipient
  const handleRemoveRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };

  // Handle sending emails to all recipients
  const handleSendEmails = async () => {
    if (!isGoogleAuthenticated()) {
      toast.error('Please connect y our Google account first.');
      return;
    }

    if (recipients.length === 0) {
      toast.error('Please add at least one recipient.');
      return;
    }

    setIsSending(true);
    setResults([]);
    setCurrentIndex(0);

    // Process each recipient sequentially
    for (let i = 0; i < recipients.length; i++) {
      setCurrentIndex(i);
      const recipient = recipients[i];
      const result = await sendEmailToRecipient(recipient);
      setResults(prev => [...prev, result]);
      
      // Optional callback for each completion
      if (onCompletion) {
        onCompletion(result);
      }

      // Add a small delay between emails to avoid throttling
      if (i < recipients.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setIsSending(false);
    setCurrentIndex(-1);

    toast.success(`Sent ${recipients.length} emails - ${results.filter(r => r.success).length} successful`);
  };

  // Send an email to a single recipient
  const sendEmailToRecipient = async (recipient: Recipient): Promise<EmailResult> => {
    try {
      // Personalize the content
      let finalSubject = emailContent.subject;
      let finalBody = emailContent.body;
      
      if (isPersonalized) {
        // Replace placeholders with recipient data
        finalSubject = finalSubject
          .replace(/\{name\}/g, recipient.name)
          .replace(/\{company\}/g, recipient.company || 'your company')
          .replace(/\{position\}/g, recipient.position || 'your position');
          
        finalBody = finalBody
          .replace(/\{name\}/g, recipient.name)
          .replace(/\{company\}/g, recipient.company || 'your company')
          .replace(/\{position\}/g, recipient.position || 'your position');
        
        // Replace custom fields if any
        if (recipient.customFields) {
          Object.entries(recipient.customFields).forEach(([key, value]) => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            finalSubject = finalSubject.replace(regex, value);
            finalBody = finalBody.replace(regex, value);
          });
        }
      }
      
      // Format with HTML if enabled
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
        bcc: emailContent.bcc,
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
    <div className="space-y-6">
      {!isGoogleAuthenticated() && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-medium text-yellow-800">Gmail Authentication Required</p>
                <p className="text-sm text-yellow-700">
                  You need to connect your Gmail account to send emails
                </p>
              </div>
              <Button onClick={() => initiateGoogleAuth()}>
                Connect Gmail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailSubject">Subject</Label>
            <Input
              id="emailSubject"
              value={emailContent.subject}
              onChange={e => setEmailContent({...emailContent, subject: e.target.value})}
              placeholder="Enter your email subject"
            />
            <p className="text-xs text-muted-foreground">
              Use {'{name}'}, {'{company}'}, {'{position}'} as placeholders
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailBody">Email Body</Label>
            <Textarea
              id="emailBody"
              value={emailContent.body}
              onChange={e => setEmailContent({...emailContent, body: e.target.value})}
              placeholder="Enter your email body"
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailCc">CC (Optional)</Label>
            <Input
              id="emailCc"
              value={emailContent.cc || ''}
              onChange={e => setEmailContent({...emailContent, cc: e.target.value})}
              placeholder="cc@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="recipientName">Name</Label>
                <Input
                  id="recipientName"
                  value={newRecipient.name}
                  onChange={e => setNewRecipient({...newRecipient, name: e.target.value})}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <Label htmlFor="recipientEmail">Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={newRecipient.email}
                  onChange={e => setNewRecipient({...newRecipient, email: e.target.value})}
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <Label htmlFor="recipientCompany">Company</Label>
                <Input
                  id="recipientCompany"
                  value={newRecipient.company || ''}
                  onChange={e => setNewRecipient({...newRecipient, company: e.target.value})}
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <Label htmlFor="recipientPosition">Position</Label>
                <Input
                  id="recipientPosition"
                  value={newRecipient.position || ''}
                  onChange={e => setNewRecipient({...newRecipient, position: e.target.value})}
                  placeholder="Marketing Director"
                />
              </div>
            </div>
            <Button onClick={handleAddRecipient} className="w-full sm:w-auto">
              Add Recipient
            </Button>

            <Separator className="my-4" />

            {recipients.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm font-medium">Recipient List ({recipients.length})</div>
                <div className="space-y-2">
                  {recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div>
                        <span className="font-medium">{recipient.name}</span>
                        <span className="mx-2 text-muted-foreground">-</span>
                        <span className="text-muted-foreground">{recipient.email}</span>
                        {recipient.company && (
                          <span className="text-xs block text-muted-foreground">
                            {recipient.position} at {recipient.company}
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveRecipient(index)}
                        disabled={isSending}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No recipients added yet
              </div>
            )}

            <div className="pt-4">
              <Button 
                onClick={handleSendEmails} 
                disabled={isSending || recipients.length === 0 || !isGoogleAuthenticated()}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending {currentIndex + 1} of {recipients.length}
                  </>
                ) : (
                  `Send Emails to ${recipients.length} Recipients`
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}
                >
                  <div className="flex justify-between">
                    <div className="font-medium">
                      {result.recipient.name} ({result.recipient.email})
                    </div>
                    <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? 'Sent' : 'Failed'}
                    </div>
                  </div>
                  <div className="text-sm mt-1">
                    {result.success ? (
                      <span className="text-green-700">Message ID: {result.messageId}</span>
                    ) : (
                      <span className="text-red-700">Error: {result.error}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.sentAt.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailOutreachAgent; 