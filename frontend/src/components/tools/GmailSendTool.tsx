'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { executeTool } from '@/tools';
import { initiateGoogleAuth, isGoogleAuthenticated } from '@/services/googleAuth';

interface GmailSendToolProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  onTest?: (result: any) => void;
}

export default function GmailSendTool({ config, onChange, onTest }: GmailSendToolProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(isGoogleAuthenticated());

  // Check authentication status on mount
  useState(() => {
    setIsAuthenticated(isGoogleAuthenticated());
  });

  // Handle authentication click
  const handleConnect = () => {
    initiateGoogleAuth();
  };

  // Handle form field updates
  const updateField = (field: string, value: string) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  // Handle test email sending
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await executeTool('gmail-send', {
        to: config.to || '',
        subject: config.subject || 'Test Email from Workflow',
        body: config.body || 'This is a test email sent from the workflow editor.',
        cc: config.cc || '',
        bcc: config.bcc || ''
      });

      setTestResult(result);
      if (onTest) {
        onTest(result);
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: String(error)
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Authentication status */}
        {!isAuthenticated && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 mb-2">
                    You need to connect your Gmail account to use this tool.
                  </p>
                  <Button onClick={handleConnect} size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Connect Gmail
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Configuration Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              placeholder="recipient@example.com"
              value={config.to || ''}
              onChange={(e) => updateField('to', e.target.value)}
              disabled={!isAuthenticated}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc">CC (Optional)</Label>
            <Input
              id="cc"
              placeholder="cc@example.com"
              value={config.cc || ''}
              onChange={(e) => updateField('cc', e.target.value)}
              disabled={!isAuthenticated}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bcc">BCC (Optional)</Label>
            <Input
              id="bcc"
              placeholder="bcc@example.com"
              value={config.bcc || ''}
              onChange={(e) => updateField('bcc', e.target.value)}
              disabled={!isAuthenticated}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={config.subject || ''}
              onChange={(e) => updateField('subject', e.target.value)}
              disabled={!isAuthenticated}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              placeholder="Email body"
              rows={6}
              value={config.body || ''}
              onChange={(e) => updateField('body', e.target.value)}
              disabled={!isAuthenticated}
              className="resize-y"
            />
            <p className="text-xs text-gray-500">
              You can use plain text or HTML for formatting.
            </p>
          </div>
        </div>

        {/* Test Actions */}
        <div className="pt-2">
          <Button 
            onClick={handleTest} 
            disabled={!isAuthenticated || isTesting || !config.to}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <Card className={`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'} mt-4`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-rose-800'}`}>
                    {testResult.success 
                      ? 'Test email sent successfully!' 
                      : `Failed to send test email: ${testResult.error}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 