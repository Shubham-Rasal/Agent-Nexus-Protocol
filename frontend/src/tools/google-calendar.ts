import { isGoogleAuthenticated, getGoogleAccessToken } from '@/services/googleAuth';

/**
 * Implementation of the Google Calendar tool
 * Creates a calendar event with Google Meet integration
 */
export const googleCalendarTool = async (params: {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
  timezone?: string;
  reminders?: { method: string; minutes: number }[];
  allDay?: boolean;
  addMeet?: boolean; // Whether to add Google Meet
}): Promise<{ success: boolean; error?: string; data?: any }> => {
  // Check if user is authenticated
  if (!isGoogleAuthenticated()) {
    return {
      success: false,
      error: 'Not authenticated with Google. Please connect your Google account first.'
    };
  }
  
  // Validate required parameters
  if (!params.title) {
    return { success: false, error: 'Event title is required.' };
  }
  
  if (!params.start) {
    return { success: false, error: 'Start time is required.' };
  }
  
  if (!params.end) {
    return { success: false, error: 'End time is required.' };
  }
  
  try {
    // Format the request to Google Calendar API
    const event: any = {
      summary: params.title,
      description: params.description || '',
      location: params.location || '',
      start: {},
      end: {},
      attendees: params.attendees ? params.attendees.map(email => {
        // Check if the email contains optional marker (*)
        const isOptional = email.includes('*');
        // Remove any special markers from the email
        const cleanEmail = email.replace(/[*]/g, '').trim();
        
        return {
          email: cleanEmail,
          optional: isOptional,
          // By default, send notifications to attendees
          responseStatus: 'needsAction'
        };
      }) : [],
      reminders: {
        useDefault: !params.reminders || params.reminders.length === 0,
        overrides: params.reminders || []
      }
    };
    
    // Add conferenceData for Google Meet if requested (default to true)
    const addMeet = params.addMeet !== false;
    if (addMeet) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet_${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      };
    }
    
    // Handle all-day events differently
    if (params.allDay) {
      // For all-day events, use date instead of dateTime
      const startDate = new Date(params.start);
      const endDate = new Date(params.end);
      
      // Format dates as YYYY-MM-DD for all-day events
      event.start.date = startDate.toISOString().split('T')[0];
      event.end.date = endDate.toISOString().split('T')[0];
    } else {
      // For time-specific events, use dateTime with timezone
      event.start = {
        dateTime: new Date(params.start).toISOString(),
        timeZone: params.timezone || 'UTC'
      };
      event.end = {
        dateTime: new Date(params.end).toISOString(),
        timeZone: params.timezone || 'UTC'
      };
    }
    
    // Get the access token
    const token = getGoogleAccessToken();
    if (!token) {
      return {
        success: false,
        error: 'Failed to get access token. Please reconnect your Google account.'
      };
    }
    
    // Make the actual API call to Google Calendar
    const response = await fetch(
      // Use conferenceDataVersion=1 to create a Google Meet
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error?.message || 'Failed to create event' 
      };
    }
    
    // Parse the response data
    const data = await response.json();
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}; 