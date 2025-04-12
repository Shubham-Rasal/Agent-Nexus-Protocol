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
  CardTitle 
} from '@/components/ui/card';
import { Loader2, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { isGoogleAuthenticated, initiateGoogleAuth } from '@/services/googleAuth';
import { MeetingSchedulerAgent, type MeetingResponse } from './agent';

// This component follows the same pattern as other agent testers but with meeting scheduler functionality
export function MeetingSchedulerTester() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MeetingResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(isGoogleAuthenticated());

  const handleConnect = () => {
    initiateGoogleAuth();
  };

  const handleTest = async () => {
    if (!prompt.trim()) {
      setError('Please enter a meeting request');
      return;
    }

    if (!isAuthenticated) {
      setError('Please connect to Google Calendar first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // First, get structured format from natural language
      const structuredResponse = await fetch('/api/agents/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
      });

      const structuredData = await structuredResponse.json();

      if (!structuredResponse.ok) {
        throw new Error(structuredData.error || 'Failed to parse meeting request');
      }

      // Then, use the agent to schedule the meeting
      const result = await MeetingSchedulerAgent.scheduleMeeting(structuredData.data);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
          <CardTitle className="text-base">Meeting Scheduler Agent</CardTitle>
        </div>
        <CardDescription>
          Enter a natural language meeting request like "Schedule a meeting with John tomorrow at 2pm"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Authentication Required</AlertTitle>
              <AlertDescription className="text-amber-800">
                You need to connect to Google Calendar to use this agent.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleConnect}
              className="w-full"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Connect to Google Calendar
            </Button>
          </div>
        ) : (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Connected to Google Calendar</AlertTitle>
              <AlertDescription className="text-green-800">
                You can now schedule meetings using natural language.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Textarea
                placeholder="Enter your meeting request..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full"
              />

              <Button
                onClick={handleTest}
                disabled={loading || !prompt.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Meeting
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Meeting Scheduled!</AlertTitle>
              <AlertDescription className="text-green-800">
                The meeting has been created in your Google Calendar.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Meeting Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Summary:</strong> {result.meeting.summary}</p>
                <p><strong>Start Time:</strong> {formatDateTime(result.meeting.startTime)}</p>
                <p><strong>Duration:</strong> {result.meeting.duration} minutes</p>
                <p><strong>Attendees:</strong> {result.meeting.attendees.join(', ')}</p>
                {result.meeting.description && (
                  <p><strong>Description:</strong> {result.meeting.description}</p>
                )}
                {result.meeting.location && (
                  <p><strong>Location:</strong> {result.meeting.location}</p>
                )}
                {result.calendar.htmlLink && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => window.open(result.calendar.htmlLink, '_blank')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    View in Google Calendar
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 