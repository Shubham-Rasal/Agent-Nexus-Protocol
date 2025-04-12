import { NextResponse } from 'next/server';
import { meetingScheduler } from '@/features/agents/gmail/meeting-scheduler';

export async function POST(request: Request) {
  try {
    // Get auth token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Parse request body
    const requestData = await request.json();
    const { title, date, startTime, endTime, attendees, description, location, timezone, authToken: bodyToken } = requestData;
    
    // Use token from header or body
    const token = authToken || bodyToken;
    
    // Set the global auth token if available
    if (token) {
      (global as any).__GMAIL_AUTH_TOKEN__ = token;
    }
    
    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Meeting title is required' },
        { status: 400 }
      );
    }
    
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Meeting date is required' },
        { status: 400 }
      );
    }
    
    if (!startTime) {
      return NextResponse.json(
        { success: false, error: 'Start time is required' },
        { status: 400 }
      );
    }
    
    if (!endTime) {
      return NextResponse.json(
        { success: false, error: 'End time is required' },
        { status: 400 }
      );
    }
    
    if (!attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one attendee is required' },
        { status: 400 }
      );
    }
    
    // Ensure the date is in YYYY-MM-DD format
    let formattedDate = date;
    if (date.includes('/')) {
      const [month, day, year] = date.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Ensure times are in HH:MM format (24-hour)
    let formattedStartTime = startTime;
    if (startTime.includes('am') || startTime.includes('pm')) {
      formattedStartTime = convertTo24Hour(startTime);
    }
    
    let formattedEndTime = endTime;
    if (endTime.includes('am') || endTime.includes('pm')) {
      formattedEndTime = convertTo24Hour(endTime);
    }
    
    // Call the meeting scheduler tool with properly formatted parameters
    const result = await meetingScheduler({
      title,
      date: formattedDate,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      attendees,
      description,
      location,
      timezone
    });
    
    // Return the result
    return NextResponse.json({
      ...result,
      authSource: token ? 'server' : 'client' // For debugging
    });
  } catch (error) {
    console.error('Error in meeting scheduler tool API:', error);
    
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Converts 12-hour time format (e.g. "2:30pm") to 24-hour format (e.g. "14:30")
 */
function convertTo24Hour(timeStr: string): string {
  // Remove whitespace and convert to lowercase
  const time = timeStr.trim().toLowerCase();
  
  // Parse the time components
  const isPM = time.includes('pm');
  const isAM = time.includes('am');
  
  // Remove am/pm indicator
  let timePart = time.replace(/am|pm/g, '').trim();
  
  // Split hours and minutes
  let [hours, minutes] = timePart.split(':');
  
  // Default minutes to 00 if not provided
  if (!minutes) {
    minutes = '00';
  }
  
  // Pad minutes with leading zero if needed
  minutes = minutes.padStart(2, '0');
  
  // Convert hour to 24-hour format
  let hour = parseInt(hours, 10);
  
  if (isPM && hour < 12) {
    hour += 12;
  } else if (isAM && hour === 12) {
    hour = 0;
  }
  
  // Format the hour with leading zero if needed
  const hourStr = hour.toString().padStart(2, '0');
  
  return `${hourStr}:${minutes}`;
} 