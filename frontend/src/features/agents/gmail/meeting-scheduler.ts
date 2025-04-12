import { isGoogleAuthenticated, createCalendarEvent } from '@/services/googleAuth';

/**
 * Implementation of the Meeting Scheduler tool for LlamaIndex integration
 * Schedules meetings through Google Calendar
 */
export const meetingScheduler = async (params: {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  location?: string;
  timezone?: string;
}) => {
  console.log("Meeting Scheduler Agent Tool - Params:", params);
  
  // Check for auth token, either from global variable (server-side) or localStorage (client-side)
  const serverAuthToken = (global as any).__GMAIL_AUTH_TOKEN__;
  const isAuthenticated = serverAuthToken ? true : isGoogleAuthenticated();
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    console.error("Meeting Scheduler Agent Tool - Not authenticated with Google");
    return {
      success: false,
      error: 'Not authenticated with Google. Please connect your Google account first.'
    };
  }
  
  // Validate required parameters
  if (!params.title) {
    console.error("Meeting Scheduler Agent Tool - Missing title");
    return { success: false, error: 'Meeting title is required.' };
  }
  
  if (!params.date) {
    console.error("Meeting Scheduler Agent Tool - Missing date");
    return { success: false, error: 'Meeting date is required.' };
  }
  
  if (!params.startTime) {
    console.error("Meeting Scheduler Agent Tool - Missing start time");
    return { success: false, error: 'Meeting start time is required.' };
  }
  
  if (!params.endTime) {
    console.error("Meeting Scheduler Agent Tool - Missing end time");
    return { success: false, error: 'Meeting end time is required.' };
  }
  
  if (!Array.isArray(params.attendees) || params.attendees.length === 0) {
    console.error("Meeting Scheduler Agent Tool - Missing or invalid attendees");
    return { success: false, error: 'At least one attendee is required.' };
  }
  
  try {
    // Use server auth token if available
    if (serverAuthToken) {
      console.log("Meeting Scheduler Agent Tool - Using server-side auth token");
    }
    
    // Parse date and times to create ISO datetime strings
    const timezone = params.timezone || 'UTC';
    const dateStr = params.date; // Format should be YYYY-MM-DD
    
    // Create ISO date-time strings for the Google Calendar API
    const startDateTime = `${dateStr}T${params.startTime}:00`;
    const endDateTime = `${dateStr}T${params.endTime}:00`;
    
    console.log("Meeting Scheduler Agent Tool - Creating calendar event:", {
      title: params.title,
      startDateTime,
      endDateTime,
      attendees: params.attendees
    });
    
    // Actually create the calendar event using the Google Calendar API
    const result = await createCalendarEvent({
      title: params.title,
      description: params.description,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      attendees: params.attendees,
      location: params.location,
      timeZone: timezone,
      authToken: serverAuthToken // Pass the server-side auth token if available
    });
    
    if (!result.success) {
      console.error("Meeting Scheduler Agent Tool - Calendar API error:", result.error);
      return {
        success: false,
        error: result.error || 'Failed to create calendar event'
      };
    }
    
    // Format times for display in the response
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    };
    
    const formattedStart = startDate.toLocaleString('en-US', formatOptions);
    const formattedEnd = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // Return the successful result with calendar event details
    return {
      success: true,
      meeting: {
        id: result.eventId,
        title: params.title,
        description: params.description || '',
        start: formattedStart,
        end: formattedEnd,
        attendees: params.attendees,
        location: params.location || 'Google Meet',
        meetLink: result.meetLink || '',
        calendarLink: result.eventLink || '',
        authSource: serverAuthToken ? 'server' : 'client'
      },
      message: `Meeting "${params.title}" successfully scheduled for ${formattedStart} with ${params.attendees.length} attendee(s).`
    };
  } catch (error) {
    console.error("Meeting Scheduler Agent Tool - Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 