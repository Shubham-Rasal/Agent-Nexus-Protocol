import { NextRequest, NextResponse } from 'next/server';
import { meetingRequestSchema } from '@/features/agents/meeting/schema';

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

function validateAndEnhanceMeetingRequest(request: any): any {
  // Ensure duration is a number
  if (typeof request.duration === 'string') {
    request.duration = parseInt(request.duration);
  }
  if (!request.duration || isNaN(request.duration)) {
    request.duration = 30; // Default to 30 minutes
  }

  // Parse and validate start time
  try {
    const parsedTime = parseRelativeTime(request.startTime);
    request.startTime = parsedTime;
  } catch (error) {
    // If time parsing fails, use next available slot
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    nextHour.setMilliseconds(0);
    request.startTime = nextHour.toISOString();
  }

  // Ensure attendees is an array
  if (typeof request.attendees === 'string') {
    request.attendees = request.attendees.split(/[,;\s]+/).filter(Boolean);
  }
  if (!Array.isArray(request.attendees)) {
    request.attendees = [];
  }

  // Ensure summary exists
  if (!request.summary) {
    request.summary = 'Meeting';
  }

  return request;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }

    // Call Lilypad LLM to parse the natural language request
    const API_URL = "https://anura-testnet.lilypad.tech/api/v1/chat/completions";
    const API_TOKEN = process.env.NEXT_PUBLIC_LILYPAD_API_KEY;

    if (!API_TOKEN) {
      throw new Error("LILYPAD_API_TOKEN environment variable is not set");
    }

    const systemMessage = `You are an AI assistant that extracts meeting information from natural language requests.
    Extract the meeting details according to the provided schema. If a specific time is not mentioned, use the next available time slot.
    If duration is not specified, default to 30 minutes.
    For the startTime field, return a descriptive string like "in 3 hours", "tomorrow at 2pm", or "at 3pm".
    The schema is: ${JSON.stringify(meetingRequestSchema, null, 2)}`;

    const messages = [
      {
        role: "system",
        content: systemMessage
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const llmResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        model: "deepscaler:1.5b",
        messages,
        max_tokens: 1000,
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`Lilypad API request failed with status ${llmResponse.status}`);
    }

    const result = await llmResponse.json();
    
    if (!result.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from Lilypad API");
    }

    // Parse and validate the structured meeting request
    const rawMeetingRequest = JSON.parse(result.choices[0].message.content);
    const meetingRequest = validateAndEnhanceMeetingRequest(rawMeetingRequest);

    return NextResponse.json({ success: true, data: meetingRequest });

  } catch (error) {
    console.error('Error in meeting scheduler structured output:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 