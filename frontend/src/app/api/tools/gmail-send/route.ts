import { NextResponse } from 'next/server';
import { gmailSend } from '@/features/agents/gmail/gmail-send';

export async function POST(request: Request) {
  try {
    // Get auth token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Parse request body
    const requestData = await request.json();
    const { to, subject, body, cc, bcc, authToken: bodyToken } = requestData;
    
    // Use token from header or body
    const token = authToken || bodyToken;
    
    // Set the global auth token if available
    if (token) {
      (global as any).__GMAIL_AUTH_TOKEN__ = token;
    }
    
    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      );
    }
    
    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Email subject is required' },
        { status: 400 }
      );
    }
    
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Email body is required' },
        { status: 400 }
      );
    }

    // Call the Gmail send tool
    const result = await gmailSend({
      to,
      subject,
      body,
      cc,
      bcc
    });
    
    // Return the result with auth source info
    return NextResponse.json({
      ...result,
      authSource: token ? 'server' : 'client' // For debugging
    });
  } catch (error) {
    console.error('Error in Gmail send tool API:', error);
    
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