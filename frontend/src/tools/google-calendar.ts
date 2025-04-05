/**
 * Google Calendar tool implementation
 * 
 * This tool allows creating events and listing upcoming events in Google Calendar
 */

export const googleCalendarTool = async (params: {
  operation: 'create' | 'list';
  summary?: string;
  description?: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  attendees?: string[];
  maxResults?: number;
  timeMin?: string;
}) => {
  try {
    const { operation } = params;
    
    // Verify Google auth is available (should be handled by the UI)
    const isGoogleAuthed = localStorage.getItem('anp_google_auth');
    if (!isGoogleAuthed) {
      console.error('Google Calendar Tool: Authentication token not found in localStorage');
      return {
        success: false,
        error: 'Google authentication required. Please connect your Google account.'
      };
    }
    
    // Get the access token
    const accessToken = localStorage.getItem('anp_google_auth');
    
    if (operation === 'create') {
      // Validate required fields for event creation
      if (!params.summary) {
        return {
          success: false,
          error: 'Event summary is required'
        };
      }
      
      if (!params.startDateTime || !params.endDateTime) {
        return {
          success: false,
          error: 'Start and end date/time are required'
        };
      }
      
      // Prepare the event data
      const eventData = {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: {
          dateTime: new Date(params.startDateTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(params.endDateTime).toISOString(),
          timeZone: 'UTC'
        },
        attendees: params.attendees ? params.attendees.map(email => ({ email })) : undefined,
        // Add a Google Meet conference by default
        conferenceData: {
          createRequest: {
            requestId: `calendar-tool-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      };
      
      // Call the Google Calendar API to create the event
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Calendar API Error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || 'Failed to create calendar event'
        };
      }
      
      const result = await response.json();
      
      return {
        success: true,
        data: result
      };
    } 
    else if (operation === 'list') {
      // Build the URL with query parameters
      const maxResults = params.maxResults || 10;
      const timeMin = params.timeMin || new Date().toISOString();
      
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&timeMin=${encodeURIComponent(timeMin)}&orderBy=startTime&singleEvents=true`;
      
      // Call the Google Calendar API to list events
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Calendar API Error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || 'Failed to list calendar events'
        };
      }
      
      const result = await response.json();
      
      return {
        success: true,
        data: result
      };
    } 
    else {
      return {
        success: false,
        error: `Unsupported operation: ${operation}`
      };
    }
  } catch (error) {
    console.error('Google Calendar tool error:', error);
    return {
      success: false,
      error: `Error executing Google Calendar tool: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}; 