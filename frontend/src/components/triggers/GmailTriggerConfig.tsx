'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, AlertCircle, Check, RefreshCw, Calendar } from 'lucide-react';
import { initiateGoogleAuth, isGoogleAuthenticated, testGmailConnection, fetchGoogleUserInfo, logoutFromGoogle, fetchTestEmails } from '@/services/googleAuth';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';

// Type definitions
interface GmailTriggerConfigProps {
  config: any;
  onChange: (config: any) => void;
}

export default function GmailTriggerConfig({ config, onChange }: GmailTriggerConfigProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Test trigger states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  
  // Options for filtering emails
  const emailConfig = config?.emailConfig || {
    fromAddress: '',
    subject: '',
    hasAttachment: false,
    maxResults: 5,
    includeParsedContent: true
  };

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      const authenticated = isGoogleAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        try {
          const userInfo = await fetchGoogleUserInfo();
          setUserInfo(userInfo);
          
          // Test Gmail connection
          const gmailConnected = await testGmailConnection();
          if (!gmailConnected) {
            setConnectionError('Gmail API access failed. Please reconnect your account.');
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
          setConnectionError('Failed to retrieve account information.');
        }
      }
    };
    
    checkAuth();
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      initiateGoogleAuth();
    } catch (error) {
      console.error('Error initiating auth:', error);
      setConnectionError('Failed to start authentication process.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    logoutFromGoogle();
    setIsAuthenticated(false);
    setUserInfo(null);
    
    // Update the config
    onChange({
      ...config,
      triggerType: 'gmail',
      connected: false,
      userEmail: null
    });
  };

  const updateEmailConfig = (key: string, value: any) => {
    const newEmailConfig = {
      ...emailConfig,
      [key]: value
    };
    
    onChange({
      ...config,
      triggerType: 'gmail',
      connected: isAuthenticated,
      userEmail: userInfo?.email || null,
      emailConfig: newEmailConfig
    });
  };

  // When the component mounts, make sure the config has triggerType set
  useEffect(() => {
    if (!config?.triggerType) {
      onChange({
        ...config,
        triggerType: 'gmail',
        connected: isAuthenticated,
        userEmail: userInfo?.email || null,
        emailConfig
      });
    }
  }, [config, isAuthenticated, userInfo]);

  // Handler for testing the trigger
  const handleTestTrigger = async () => {
    if (!isAuthenticated) return;
    
    setIsTesting(true);
    setTestError(null);
    setTestResult(null);
    
    try {
      const result = await fetchTestEmails({
        fromAddress: emailConfig.fromAddress,
        subject: emailConfig.subject,
        hasAttachment: emailConfig.hasAttachment,
        maxResults: emailConfig.maxResults
      });
      
      if (result.success) {
        setTestResult(result);
      } else {
        setTestError(result.error || 'Failed to fetch test emails');
      }
    } catch (error) {
      console.error('Error testing trigger:', error);
      setTestError(String(error) || 'An error occurred while testing the trigger');
    } finally {
      setIsTesting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Gmail Trigger</h3>
        <p className="text-sm text-gray-500">
          This trigger will start your workflow when you receive emails in your Gmail inbox matching your criteria.
        </p>
      </div>
      
      {/* Authentication Section */}
      <div className="p-4 border rounded-md bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">Gmail Account</h4>
              {isAuthenticated && userInfo ? (
                <p className="text-sm text-gray-500">{userInfo.email}</p>
              ) : (
                <p className="text-sm text-gray-500">Not connected</p>
              )}
            </div>
          </div>
          
          {isAuthenticated ? (
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect Gmail'}
            </Button>
          )}
        </div>
        
        {connectionError && (
          <div className="mt-3 p-2 bg-red-50 text-red-600 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            {connectionError}
          </div>
        )}
        
        {isAuthenticated && (
          <div className="mt-3 p-2 bg-green-50 text-green-600 rounded-md flex items-center gap-2 text-sm">
            <Check className="h-4 w-4" />
            Connected successfully
          </div>
        )}
      </div>
      
      {/* Email Filter Settings */}
      {isAuthenticated && (
        <div className="space-y-4">
          <h4 className="font-medium">Email Filter Settings</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="fromAddress">From Address</Label>
              <Input 
                id="fromAddress" 
                placeholder="e.g., example@gmail.com (leave empty for any)" 
                value={emailConfig.fromAddress}
                onChange={(e) => updateEmailConfig('fromAddress', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Contains</Label>
              <Input 
                id="subject" 
                placeholder="e.g., Invoice, Report (leave empty for any)" 
                value={emailConfig.subject}
                onChange={(e) => updateEmailConfig('subject', e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hasAttachment" 
                checked={emailConfig.hasAttachment} 
                onCheckedChange={(checked) => updateEmailConfig('hasAttachment', Boolean(checked))}
              />
              <Label htmlFor="hasAttachment" className="text-sm cursor-pointer">
                Require Attachment
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxResults">Maximum Emails to Fetch</Label>
              <Input 
                id="maxResults" 
                type="number" 
                min={1} 
                max={50} 
                value={emailConfig.maxResults}
                onChange={(e) => updateEmailConfig('maxResults', parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-gray-500">
                How many emails to process per check (1-50).
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeParsedContent">Include Parsed Email Content</Label>
                <p className="text-xs text-gray-500">
                  Include the email body content in workflow data
                </p>
              </div>
              <Switch 
                id="includeParsedContent" 
                checked={emailConfig.includeParsedContent}
                onCheckedChange={(checked) => updateEmailConfig('includeParsedContent', checked)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Test Trigger Section */}
      {isAuthenticated && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Test Your Trigger</h4>
            <Button 
              onClick={handleTestTrigger} 
              disabled={isTesting}
              variant="outline"
              size="sm"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Trigger
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            Test your trigger with the current filter settings to see if it finds matching emails.
          </div>
          
          {testError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>{testError}</div>
            </div>
          )}
          
          {testResult && (
            <div className="space-y-4">
              {testResult.total === 0 ? (
                <div className="p-4 border rounded-md bg-yellow-50 text-yellow-700">
                  No emails found matching your criteria. Try adjusting your filters.
                </div>
              ) : (
                <>
                  <div className="p-3 bg-green-50 text-green-600 rounded-md">
                    Found {testResult.total} email{testResult.total !== 1 ? 's' : ''} matching your criteria.
                  </div>
                  
                  {testResult.messages.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Sample Email:</h5>
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between">
                            <div className="font-medium">{testResult.messages[0].subject}</div>
                            {testResult.messages[0].hasAttachments && (
                              <div className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                Has Attachments
                              </div>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            From: {testResult.messages[0].from}
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(testResult.messages[0].date)}
                          </div>
                          
                          <div className="border-t pt-2 mt-2">
                            <div className="text-sm text-gray-700">
                              {testResult.messages[0].snippet}...
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="mt-3 text-xs text-gray-500">
                        When this trigger runs, it will process up to {emailConfig.maxResults} matching emails at a time.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 