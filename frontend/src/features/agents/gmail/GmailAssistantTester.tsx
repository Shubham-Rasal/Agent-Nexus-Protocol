'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Calendar, AlertCircle, CheckCircle, Send, Video } from 'lucide-react';
import { isGoogleAuthenticated, initiateGoogleAuth } from '@/services/googleAuth';
import { toast } from 'sonner';

interface ToolCall {
  tool: string;
  input: string;
  output: string;
}

interface AgentResult {
  success: boolean;
  response?: string;
  toolCalls?: ToolCall[];
  error?: string;
}

export function GmailAssistantTester() {
  // State for prompt and results
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(isGoogleAuthenticated());
  
  // Check if authenticated
  const checkAuthentication = () => {
    const authenticated = isGoogleAuthenticated();
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      setError('You need to connect to Google to use this feature');
      return false;
    }
    return true;
  };
  
  // Handle Google authentication
  const handleConnect = () => {
    initiateGoogleAuth();
    // After redirect back, the authenticated state will be updated
  };
  
  // Direct test of calendar integration
  const testCalendarIntegration = async () => {
    if (!checkAuthentication()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get OAuth token from localStorage
      const authToken = localStorage.getItem('anp_google_auth');
      if (!authToken) {
        throw new Error('Authentication token not found. Please reconnect to Google.');
      }
      
      // Create a test meeting (15 minutes from now, for 30 minutes)
      const now = new Date();
      const startTime = new Date(now.getTime() + 15 * 60000); // 15 minutes from now
      const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes duration
      
      // Format dates for API
      const date = startTime.toISOString().split('T')[0];
      const formattedStartTime = startTime.toTimeString().split(' ')[0].substring(0, 5);
      const formattedEndTime = endTime.toTimeString().split(' ')[0].substring(0, 5);
      
      // Get user's email from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }
      
      const userData = await userResponse.json();
      const userEmail = userData.email;
      
      const response = await fetch('/api/tools/meeting-scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'Test Calendar Integration',
          date,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          attendees: [userEmail],
          description: 'This is a test meeting to verify calendar integration is working correctly.',
          authToken
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test meeting');
      }
      
      setResult({
        success: true,
        response: 'Test meeting created successfully! Check the "Actions Performed" section for details and links.',
        toolCalls: [{
          tool: 'MeetingScheduler',
          input: JSON.stringify({
            title: 'Test Calendar Integration',
            date,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            attendees: [userEmail]
          }, null, 2),
          output: JSON.stringify(data, null, 2)
        }]
      });
      
      toast.success('Test meeting created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to create test meeting: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Process the prompt with the Gmail assistant
  const processPrompt = async () => {
    if (!checkAuthentication()) return;
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Get OAuth token from localStorage
      const authToken = localStorage.getItem('anp_google_auth');
      if (!authToken) {
        throw new Error('Authentication token not found. Please reconnect to Google.');
      }
      
      const response = await fetch('/api/agents/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Send auth token in header
        },
        body: JSON.stringify({ 
          message: prompt,
          authToken: authToken // Also include in body for flexibility
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }
      
      setResult({
        success: true,
        response: data.response,
        toolCalls: data.toolCalls || []
      });
      
      // Show a toast based on the type of operation performed
      const emailCall = data.toolCalls?.find((call: any) => call.tool === 'GmailSend');
      const meetingCall = data.toolCalls?.find((call: any) => call.tool === 'MeetingScheduler');
      
      if (emailCall) {
        toast.success('Email action processed successfully');
      } else if (meetingCall) {
        toast.success('Meeting scheduler action processed successfully');
      } else {
        toast.success('Request processed successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setResult({
        success: false,
        error: errorMessage
      });
      toast.error('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  // Render a tool call result
  const renderToolCall = (toolCall: ToolCall) => {
    let icon;
    let color;
    let title;
    
    switch (toolCall.tool) {
      case 'GmailSend':
        icon = <Mail className="h-5 w-5 text-blue-500" />;
        color = 'bg-blue-50 border-blue-100';
        title = 'Email Sent';
        break;
      case 'MeetingScheduler':
        icon = <Calendar className="h-5 w-5 text-green-500" />;
        color = 'bg-green-50 border-green-100';
        title = 'Meeting Scheduled';
        break;
      case 'ContactSearch':
        icon = <AlertCircle className="h-5 w-5 text-amber-500" />;
        color = 'bg-amber-50 border-amber-100';
        title = 'Contact Search';
        break;
      case 'EmailTemplate':
        icon = <Mail className="h-5 w-5 text-purple-500" />;
        color = 'bg-purple-50 border-purple-100';
        title = 'Email Template';
        break;
      default:
        icon = <AlertCircle className="h-5 w-5 text-gray-500" />;
        color = 'bg-gray-50 border-gray-100';
        title = toolCall.tool;
    }
    
    // Try to parse input and output as JSON for better display
    let inputData;
    let outputData;
    
    try {
      inputData = JSON.parse(toolCall.input);
    } catch (e) {
      inputData = toolCall.input;
    }
    
    try {
      outputData = JSON.parse(toolCall.output);
    } catch (e) {
      outputData = toolCall.output;
    }
    
    // Render calendar links if available (for meeting scheduler)
    const renderCalendarLinks = () => {
      if (toolCall.tool === 'MeetingScheduler' && typeof outputData === 'object') {
        const meeting = outputData.meeting || {};
        const calendarLink = meeting.calendarLink;
        const meetLink = meeting.meetLink;
        
        if (calendarLink || meetLink) {
          return (
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-medium">Meeting Links:</h4>
              <div className="space-y-1">
                {calendarLink && (
                  <div>
                    <a 
                      href={calendarLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      View in Google Calendar
                    </a>
                  </div>
                )}
                {meetLink && (
                  <div>
                    <a 
                      href={meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Video className="h-3 w-3 mr-1" />
                      Join Google Meet
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        }
      }
      return null;
    };
    
    return (
      <div className={`p-4 rounded-lg border mb-4 ${color}`}>
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-1">Input:</h4>
            <pre className="text-xs bg-white/50 p-2 rounded overflow-auto">
              {typeof inputData === 'object' ? JSON.stringify(inputData, null, 2) : inputData}
            </pre>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Output:</h4>
            <pre className="text-xs bg-white/50 p-2 rounded overflow-auto">
              {typeof outputData === 'object' ? JSON.stringify(outputData, null, 2) : outputData}
            </pre>
          </div>
          
          {renderCalendarLinks()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Authentication Status */}
      {!isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to connect to Google to use the Gmail Assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-amber-50 border-amber-200 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Not Connected</AlertTitle>
              <AlertDescription className="text-amber-800">
                This agent requires Google authentication to send emails and schedule meetings.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleConnect}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Connect to Google
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gmail Assistant</CardTitle>
            <CardDescription>
              Use natural language to send emails, schedule meetings, search contacts, or generate email templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prompt">What would you like to do?</Label>
              <Textarea
                id="prompt"
                placeholder="Examples: Send an email to john@example.com about the project update, Schedule a meeting with Sarah tomorrow at 2pm, Find contact information for Mark Johnson"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={processPrompt}
                  disabled={loading || !prompt.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Process Request
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={testCalendarIntegration}
                  disabled={loading}
                  title="Create a test meeting to verify calendar integration"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Test Calendar
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && (
              <div className="space-y-4 pt-4">
                {result.response && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-medium mb-2">Agent Response:</h3>
                    <p className="whitespace-pre-wrap text-sm">{result.response}</p>
                  </div>
                )}
                
                {result.toolCalls && result.toolCalls.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Actions Performed:</h3>
                    <div className="space-y-2">
                      {result.toolCalls.map((toolCall, index) => (
                        <div key={index}>
                          {renderToolCall(toolCall)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-2">Example Prompts:</h3>
              <ul className="text-sm space-y-2">
                <li><strong>Email:</strong> "Send an email to team@example.com about the project deadline extension"</li>
                <li><strong>Meeting:</strong> "Schedule a team meeting tomorrow at 3pm for 1 hour"</li>
                <li><strong>Contact:</strong> "Find contact information for Sarah Williams"</li>
                <li><strong>Template:</strong> "Create a follow-up email template for John at Acme Inc"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 