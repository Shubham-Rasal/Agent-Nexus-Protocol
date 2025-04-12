import { NextRequest, NextResponse } from 'next/server';
import { meetingScheduler } from '@/features/agents/gmail/meeting-scheduler';
import { OpenAI } from 'llamaindex';

function parseRelativeTime(timeStr: string): string {
  const now = new Date();
  
  // Handle "in X hours"
  const hoursMatch = timeStr.match(/in (\d+) hours?/i);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    const date = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return date.toISOString();
  }

  // Handle "tomorrow at X"
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
      return tomorrow.toISOString();
    }
    
    // Default to 9am if no specific time given
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString();
  }

  // Handle "at X" (today)
  const timeMatch = timeStr.match(/at (\d+)(?::(\d+))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridian = timeMatch[3]?.toLowerCase();
    
    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
    
    const date = new Date(now);
    date.setHours(hours, minutes, 0, 0);
    
    // If the time is in the past, assume tomorrow
    if (date.getTime() < now.getTime()) {
      date.setDate(date.getDate() + 1);
    }
    
    return date.toISOString();
  }

  // Default to next hour
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1);
  nextHour.setMinutes(0);
  nextHour.setSeconds(0);
  nextHour.setMilliseconds(0);
  return nextHour.toISOString();
}

function formatTimeForDisplay(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatDateForCalendar(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

function formatTimeForCalendar(isoString: string): string {
  const date = new Date(isoString);
  return date.toTimeString().split(' ')[0].substring(0, 5); // Returns HH:MM format
}

function getEndTime(startTimeIso: string, durationMinutes: number): string {
  const startTime = new Date(startTimeIso);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  return endTime.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Check for auth token
    const authToken = body.authToken;
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }
    
    // Forward the request to the Gmail agent endpoint with the auth token
    const response = await fetch(new URL('/api/agents/gmail', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` // Pass token in headers
      },
      body: JSON.stringify({ 
        message: body.message || `Schedule a meeting ${body.title ? `titled "${body.title}"` : ''}`,
        authToken: authToken // Also include in body for flexibility
      }),
    });
    
    // Forward the response back
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding to Gmail agent:', error);
    
    let errorMessage = 'An error occurred forwarding the request';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 