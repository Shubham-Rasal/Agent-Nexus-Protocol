import { executeTool } from '@/tools';
import { isGoogleAuthenticated } from '@/services/googleAuth';

export interface MeetingRequest {
  summary: string;
  attendees: string[];
  duration: number;
  startTime: string;
  description?: string;
  location?: string;
}

export interface MeetingResponse {
  meeting: MeetingRequest;
  calendar: any;
}

export class MeetingSchedulerAgent {
  /**
   * Schedule a meeting using the structured meeting request
   */
  static async scheduleMeeting(meetingRequest: MeetingRequest): Promise<MeetingResponse> {
    // Verify Google Calendar authentication
    if (!isGoogleAuthenticated()) {
      throw new Error('Google Calendar authentication required');
    }

    // Validate the meeting request
    const validatedRequest = this.validateMeetingRequest(meetingRequest);

    // Calculate end time from start time and duration
    const startTime = new Date(validatedRequest.startTime);
    const endTime = new Date(startTime.getTime() + validatedRequest.duration * 60000);

    // Create calendar event using the Google Calendar tool
    const calendarResponse = await executeTool('google-calendar', {
      operation: 'create',
      summary: validatedRequest.summary,
      description: validatedRequest.description || '',
      location: validatedRequest.location || '',
      startDateTime: startTime.toISOString(),
      endDateTime: endTime.toISOString(),
      attendees: validatedRequest.attendees
    });

    if (!calendarResponse.success) {
      throw new Error(calendarResponse.error || 'Failed to create calendar event');
    }

    return {
      meeting: validatedRequest,
      calendar: calendarResponse.data
    };
  }

  /**
   * Validate and normalize a meeting request
   */
  private static validateMeetingRequest(request: MeetingRequest): MeetingRequest {
    const validated: MeetingRequest = {
      ...request,
      summary: request.summary || 'Meeting',
      attendees: Array.isArray(request.attendees) ? request.attendees : [],
      duration: this.validateDuration(request.duration),
      startTime: this.validateStartTime(request.startTime)
    };

    // Ensure start time is in the future
    const startTime = new Date(validated.startTime);
    const now = new Date();
    if (startTime.getTime() <= now.getTime()) {
      validated.startTime = this.getNextAvailableSlot().toISOString();
    }

    return validated;
  }

  /**
   * Validate and normalize duration
   */
  private static validateDuration(duration: number | string | undefined): number {
    if (typeof duration === 'string') {
      duration = parseInt(duration);
    }
    
    if (!duration || isNaN(duration) || duration < 15) {
      return 30; // Default to 30 minutes
    }
    
    if (duration > 480) {
      return 480; // Cap at 8 hours
    }
    
    return Math.round(duration); // Ensure it's a whole number
  }

  /**
   * Validate and normalize start time
   */
  private static validateStartTime(startTime: string): string {
    try {
      const date = new Date(startTime);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toISOString();
    } catch (error) {
      return this.getNextAvailableSlot().toISOString();
    }
  }

  /**
   * Get the next available time slot based on current time
   */
  private static getNextAvailableSlot(durationMinutes: number = 30): Date {
    const now = new Date();
    // Round up to the next hour
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    nextHour.setMilliseconds(0);
    return nextHour;
  }

  /**
   * Parse a relative time (e.g., "in 3 hours", "tomorrow at 2pm") to an absolute time
   */
  static parseRelativeTime(timeStr: string): Date {
    // This is a placeholder - in a real implementation, you would use a proper
    // natural language date parsing library like Chrono-node
    const now = new Date();
    
    // Simple handling of "in X hours"
    const hoursMatch = timeStr.match(/in (\d+) hours?/i);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }

    // Simple handling of "tomorrow at X"
    if (timeStr.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const timeMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const meridian = timeMatch[3]?.toLowerCase();
        
        if (meridian === 'pm' && hours < 12) hours += 12;
        if (meridian === 'am' && hours === 12) hours = 0;
        
        tomorrow.setHours(hours, minutes, 0, 0);
        return tomorrow;
      }
      
      // Default to 9am if no specific time given
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }

    // Default to next available slot if we can't parse the time
    return this.getNextAvailableSlot();
  }
} 