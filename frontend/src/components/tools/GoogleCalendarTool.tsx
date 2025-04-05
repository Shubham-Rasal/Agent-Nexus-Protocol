'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { executeTool } from '@/tools';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Calendar,
  Clock
} from 'lucide-react';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { isGoogleAuthenticated, initiateGoogleAuth } from '@/services/googleAuth';

interface GoogleCalendarToolProps {
  config?: {
    summary?: string;
    description?: string;
    location?: string;
    startDateTime?: string;
    endDateTime?: string;
    attendees?: string;
    operation?: string;
  };
  onChange?: (config: any) => void;
  testMode?: boolean;
}

export default function GoogleCalendarTool({ 
  config, 
  onChange, 
  testMode 
}: GoogleCalendarToolProps) {
  const [summary, setSummary] = useState(config?.summary || '');
  const [description, setDescription] = useState(config?.description || '');
  const [location, setLocation] = useState(config?.location || '');
  const [startDateTime, setStartDateTime] = useState(config?.startDateTime || '');
  const [endDateTime, setEndDateTime] = useState(config?.endDateTime || '');
  const [attendees, setAttendees] = useState(config?.attendees || '');
  const [operation, setOperation] = useState(config?.operation || 'create');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const isAuthed = isGoogleAuthenticated();
      console.log('Google Calendar Authentication Status:', isAuthed);
      setIsAuthenticated(isAuthed);
    };
    
    checkAuthStatus();
    
    // Set up a listener for storage changes (in case user authenticates in another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update config when inputs change
  useEffect(() => {
    if (onChange) {
      onChange({
        summary,
        description,
        location,
        startDateTime,
        endDateTime,
        attendees,
        operation
      });
    }
  }, [summary, description, location, startDateTime, endDateTime, attendees, operation, onChange]);

  // Initialize start and end dates if not set
  useEffect(() => {
    if (!startDateTime) {
      // Set default start time to nearest hour in the future
      const start = new Date();
      start.setHours(start.getHours() + 1);
      start.setMinutes(0);
      start.setSeconds(0);
      setStartDateTime(start.toISOString().slice(0, 16));
      
      // Set default end time to 1 hour after start
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      setEndDateTime(end.toISOString().slice(0, 16));
    }
  }, [startDateTime]);

  const handleConnect = () => {
    initiateGoogleAuth();
  };

  const handleTestTool = async () => {
    // Double-check authentication right before executing the tool
    if (!isGoogleAuthenticated()) {
      setError('Authentication token is missing or expired. Please connect to Google Calendar again.');
      setIsAuthenticated(false);
      return;
    }

    if (operation === 'create' && !summary) {
      setError('Event summary is required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params: any = {
        operation
      };
      
      if (operation === 'create') {
        params.summary = summary;
        params.description = description || undefined;
        params.location = location || undefined;
        params.startDateTime = startDateTime;
        params.endDateTime = endDateTime;
        params.attendees = attendees ? attendees.split(',').map(email => email.trim()) : undefined;
      } else if (operation === 'list') {
        params.maxResults = 10;
        params.timeMin = new Date().toISOString();
      }

      const response = await executeTool('google-calendar', params);

      if (!response.success) {
        setError(response.error || 'Failed to execute Google Calendar tool');
      } else {
        setResult(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSummary('');
    setDescription('');
    setLocation('');
    
    // Reset with default times
    const start = new Date();
    start.setHours(start.getHours() + 1);
    start.setMinutes(0);
    start.setSeconds(0);
    setStartDateTime(start.toISOString().slice(0, 16));
    
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    setEndDateTime(end.toISOString().slice(0, 16));
    
    setAttendees('');
    setOperation('create');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {!isAuthenticated ? (
        <div className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Authentication Required</AlertTitle>
            <AlertDescription className="text-amber-800">
              You need to connect to Google Calendar to use this tool.
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
              You can now use Google Calendar features.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select 
                value={operation} 
                onValueChange={setOperation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create Event</SelectItem>
                  <SelectItem value="list">List Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {operation === 'create' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="summary">Event Summary*</Label>
                  <Input
                    id="summary"
                    placeholder="e.g. Team Meeting"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Event description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Conference Room A or Zoom link"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDateTime">Start Date & Time*</Label>
                    <Input
                      id="startDateTime"
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDateTime">End Date & Time*</Label>
                    <Input
                      id="endDateTime"
                      type="datetime-local"
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="attendees">Attendees</Label>
                  <Input
                    id="attendees"
                    placeholder="Comma-separated email addresses"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">Enter email addresses separated by commas</p>
                </div>
              </>
            )}
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
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-800 font-medium">
              {operation === 'create' 
                ? 'Calendar event created successfully!' 
                : `Found ${result.items?.length || 0} upcoming events`}
            </AlertDescription>
          </Alert>
          
          {operation === 'create' && result.htmlLink && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open(result.htmlLink, '_blank')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Event in Google Calendar
            </Button>
          )}
          
          {operation === 'list' && result.items && result.items.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-medium">Upcoming Events:</h3>
              {result.items.map((event: any, index: number) => (
                <div key={index} className="p-3 border rounded-md text-sm">
                  <div className="font-medium">{event.summary}</div>
                  {event.start?.dateTime && (
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(event.start.dateTime).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Separator />

      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={handleReset} 
          disabled={loading}
        >
          Reset
        </Button>
        <Button 
          onClick={handleTestTool} 
          disabled={loading || !isAuthenticated}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              {operation === 'create' ? 'Create Event' : 'List Events'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 