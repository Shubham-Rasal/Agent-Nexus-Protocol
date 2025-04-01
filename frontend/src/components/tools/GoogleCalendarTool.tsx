'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, CheckCircle, AlertCircle, Loader2, Clock, UserPlus, MapPin, Bell, Video, Link as LinkIcon } from 'lucide-react';
import { executeTool } from '@/tools';
import { initiateGoogleAuth, isGoogleAuthenticated } from '@/services/googleAuth';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';

interface GoogleCalendarToolProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  onTest?: (result: any) => void;
}

export default function GoogleCalendarTool({ config, onChange, onTest }: GoogleCalendarToolProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; data?: any } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(isGoogleAuthenticated());
  
  // Check authentication status on mount and when the component refreshes
  useEffect(() => {
    setIsAuthenticated(isGoogleAuthenticated());
  }, []);

  // Handle authentication click
  const handleConnect = () => {
    initiateGoogleAuth();
  };

  // Handle form field updates
  const updateField = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };
  
  // Handle attendees updates (comma-separated list)
  const updateAttendees = (value: string) => {
    const attendeesList = value.split(',').map(email => email.trim()).filter(email => email);
    onChange({
      ...config,
      attendees: attendeesList
    });
  };

  // Handle test event creation
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Format attendees array from comma-separated string if needed
      const attendees = config.attendees || [];
      
      const result = await executeTool('google-calendar', {
        title: config.title || 'Test Event',
        start: config.start || new Date().toISOString(),
        end: config.end || new Date(Date.now() + 3600000).toISOString(), // 1 hour later
        description: config.description || '',
        location: config.location || '',
        attendees: typeof attendees === 'string' ? attendees.split(',').map(email => email.trim()) : attendees,
        timezone: config.timezone || 'UTC',
        allDay: config.allDay || false,
        addMeet: config.addMeet !== false // Default to true
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
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {!isAuthenticated ? (
        <div className="text-center py-6">
          <div className="flex justify-center space-x-2 mb-4">
            <CalendarIcon className="h-12 w-12 text-blue-400" />
            <Video className="h-12 w-12 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Connect Google Calendar</h3>
          <p className="text-sm text-gray-500 mb-4">
            You need to connect your Google account to create calendar events and meetings.
          </p>
          <Button onClick={handleConnect} variant="default">
            Connect Google Account
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium">Google Calendar & Meet</h3>
              <p className="text-sm text-gray-500">Create calendar events with optional Google Meet integration</p>
            </div>
          </div>
        
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Team Meeting"
              value={config.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2 my-4">
            <Switch
              id="allDay"
              checked={config.allDay || false}
              onCheckedChange={(checked) => updateField('allDay', checked)}
            />
            <Label htmlFor="allDay">All-day event</Label>
          </div>
          
          <div className="flex items-center space-x-2 my-4 border p-3 rounded-md bg-blue-50">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4 text-blue-600" />
                <Label htmlFor="addMeet" className="font-medium text-blue-800">Google Meet Videoconference</Label>
              </div>
              <p className="text-xs text-gray-600 ml-6 mt-1">Add a Google Meet link to this calendar event</p>
            </div>
            <Switch
              id="addMeet"
              checked={config.addMeet !== false} // Default to true
              onCheckedChange={(checked) => updateField('addMeet', checked)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Time</Label>
              <Input
                id="start"
                type={config.allDay ? "date" : "datetime-local"}
                value={config.start || ''}
                onChange={(e) => updateField('start', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end">End Time</Label>
              <Input
                id="end"
                type={config.allDay ? "date" : "datetime-local"}
                value={config.end || ''}
                onChange={(e) => updateField('end', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Office Room 101 or Conference Room"
              value={config.location || ''}
              onChange={(e) => updateField('location', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Event details and agenda..."
              value={config.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees (comma-separated emails)</Label>
            <Input
              id="attendees"
              placeholder="user@example.com, another@example.com"
              value={Array.isArray(config.attendees) ? config.attendees.join(', ') : config.attendees || ''}
              onChange={(e) => updateField('attendees', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              placeholder="UTC"
              value={config.timezone || ''}
              onChange={(e) => updateField('timezone', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to use UTC</p>
          </div>
          
          <Button 
            onClick={handleTest} 
            disabled={isTesting || !config.title || !config.start || !config.end}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                {config.addMeet !== false ? (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Create Event with Meet
                  </>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Create Calendar Event
                  </>
                )}
              </>
            )}
          </Button>
          
          {testResult && (
            <Card className={`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-rose-800'} mb-2`}>
                      {testResult.success 
                        ? (testResult.data?.conferenceData ? 'Event with Google Meet created successfully!' : 'Calendar event created successfully!') 
                        : `Failed to create event: ${testResult.error}`}
                    </p>
                    
                    {testResult.success && testResult.data && (
                      <div className="space-y-3 mt-3">
                        <div>
                          <h4 className="text-sm font-medium flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Event Details
                          </h4>
                          <p className="text-sm mt-1">{testResult.data.summary}</p>
                          
                          <div className="flex items-center mt-2 gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {testResult.data.start.dateTime 
                                ? `${formatDate(testResult.data.start.dateTime)} - ${formatDate(testResult.data.end.dateTime)}` 
                                : `All Day: ${testResult.data.start.date} - ${testResult.data.end.date}`}
                            </span>
                          </div>
                          
                          {testResult.data.location && (
                            <div className="flex items-center mt-1 gap-2 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span>{testResult.data.location}</span>
                            </div>
                          )}
                          
                          {testResult.data.attendees && testResult.data.attendees.length > 0 && (
                            <div className="flex items-center mt-1 gap-2 text-xs text-gray-500">
                              <UserPlus className="h-3 w-3" />
                              <span>
                                {testResult.data.attendees.map((a: any) => a.email).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <Separator />
                        
                        {/* Display Google Meet link if available */}
                        {testResult.data.conferenceData && testResult.data.conferenceData.entryPoints && (
                          <div>
                            <h4 className="text-sm font-medium flex items-center">
                              <Video className="h-4 w-4 mr-2" />
                              Google Meet
                            </h4>
                            
                            <div className="bg-white p-2 rounded border border-green-200 mt-2 flex items-center justify-between">
                              <code className="text-xs text-blue-600 overflow-auto max-w-[250px]">
                                {testResult.data.conferenceData.entryPoints[0].uri}
                              </code>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-6 w-6 p-0 flex-shrink-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(testResult.data.conferenceData.entryPoints[0].uri);
                                }}
                              >
                                <LinkIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-medium flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Calendar Link
                          </h4>
                          
                          <div className="bg-white p-2 rounded border border-green-200 mt-2">
                            <a 
                              href={testResult.data.htmlLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {testResult.data.htmlLink}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
} 