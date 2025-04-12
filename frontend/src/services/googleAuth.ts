// Google OAuth and Gmail API Integration

// These would typically come from environment variables
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly', // For reading emails
  'https://www.googleapis.com/auth/gmail.send',     // For sending emails
  'https://www.googleapis.com/auth/userinfo.email', // For user info
  'https://www.googleapis.com/auth/calendar',       // For Google Calendar access
  'https://www.googleapis.com/auth/calendar.events', // For managing calendar events
  'https://www.googleapis.com/auth/calendar.events.readonly', // For reading calendar events
  'https://www.googleapis.com/auth/calendar.addons.execute', // For calendar add-ons
];

// Store tokens in localStorage with these keys
const AUTH_STORAGE_KEY = 'anp_google_auth';
const TOKEN_EXPIRY_KEY = 'anp_google_token_expiry';

/**
 * Initiates the Google OAuth flow
 */
export const initiateGoogleAuth = () => {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('prompt', 'consent');
  
  // Open the auth window
  window.location.href = authUrl.toString();
};

/**
 * Handles the OAuth callback and stores the token
 */
export const handleAuthCallback = () => {
  // Check if we're on the callback page
  if (!window.location.hash.includes('access_token')) {
    return null;
  }
  
  // Extract token from URL hash
  const params = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  
  if (accessToken && expiresIn) {
    // Calculate expiry time
    const expiryTime = Date.now() + (parseInt(expiresIn) * 1000);
    
    // Store in localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, accessToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Clear the URL hash
    window.history.replaceState(null, document.title, window.location.pathname);
    
    return accessToken;
  }
  
  return null;
};

/**
 * Checks if the user is authenticated with Google
 */
export const isGoogleAuthenticated = (): boolean => {
  // Check for browser environment (important for Next.js SSR)
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  // Check if token exists and is not expired
  const token = localStorage.getItem(AUTH_STORAGE_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryTime) {
    return false;
  }
  
  // Check if token is expired
  const now = Date.now();
  const isValid = now < parseInt(expiryTime);
  
  // If token is expired, clean up
  if (!isValid) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
  
  return isValid;
};

/**
 * Gets the stored access token
 */
export const getGoogleAccessToken = (): string | null => {
  if (!isGoogleAuthenticated()) {
    return null;
  }
  
  return localStorage.getItem(AUTH_STORAGE_KEY);
};

/**
 * Fetches user info from Google
 */
export const fetchGoogleUserInfo = async (): Promise<any> => {
  const accessToken = getGoogleAccessToken();
  
  if (!accessToken) {
    throw new Error('Not authenticated with Google');
  }
  
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google user info');
  }
  
  return response.json();
};

/**
 * Logs out of Google by removing stored tokens
 */
export const logoutFromGoogle = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * Tests the Gmail connection by fetching recent messages
 */
export const testGmailConnection = async (): Promise<boolean> => {
  const accessToken = getGoogleAccessToken();
  
  if (!accessToken) {
    return false;
  }
  
  try {
    // Just fetch one message to test connectivity
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=1', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error testing Gmail connection:', error);
    return false;
  }
};

/**
 * Fetches test emails to verify the Gmail trigger configuration
 */
export const fetchTestEmails = async (filterOptions: {
  fromAddress?: string;
  subject?: string;
  hasAttachment?: boolean;
  maxResults?: number;
}): Promise<any> => {
  const accessToken = getGoogleAccessToken();
  
  if (!accessToken) {
    throw new Error('Not authenticated with Google');
  }
  
  try {
    // Build the query based on filter options
    let query = '';
    if (filterOptions.fromAddress) {
      query += `from:${filterOptions.fromAddress} `;
    }
    if (filterOptions.subject) {
      query += `subject:${filterOptions.subject} `;
    }
    if (filterOptions.hasAttachment) {
      query += 'has:attachment ';
    }
    
    // Remove trailing space
    query = query.trim();
    
    // Set up request parameters
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('maxResults', String(filterOptions.maxResults || 5));
    
    // Fetch message list
    const listResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!listResponse.ok) {
      throw new Error('Failed to fetch emails');
    }
    
    const listData = await listResponse.json();
    
    // If no messages found, return empty result
    if (!listData.messages || listData.messages.length === 0) {
      return { success: true, messages: [], total: 0 };
    }
    
    // Get details for the first message to show as an example
    const messageId = listData.messages[0].id;
    const messageResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!messageResponse.ok) {
      throw new Error('Failed to fetch message details');
    }
    
    const messageData = await messageResponse.json();
    
    // Process message to extract key info
    const headers = messageData.payload.headers;
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No subject)';
    const from = headers.find((h: any) => h.name === 'From')?.value || '(Unknown sender)';
    const date = headers.find((h: any) => h.name === 'Date')?.value || '';
    
    // Check for attachments
    const hasAttachments = messageData.payload.parts?.some((part: any) => part.filename && part.filename.length > 0) || false;
    
    // Extract snippet
    const snippet = messageData.snippet || '';
    
    return { 
      success: true, 
      messages: [{ id: messageId, subject, from, date, snippet, hasAttachments }],
      total: listData.messages.length,
      resultCount: listData.resultSizeEstimate
    };
  } catch (error) {
    console.error('Error fetching test emails:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Sends an email using Gmail API
 */
export const sendGmailEmail = async (emailData: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  authToken?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  // Use provided auth token or get from localStorage
  const accessToken = emailData.authToken || getGoogleAccessToken();
  
  if (!accessToken) {
    return { success: false, error: 'Not authenticated with Google' };
  }
  
  try {
    // Format the email according to RFC 5322
    // IMPORTANT: The empty line between headers and body is crucial
    const headers = [
      `To: ${emailData.to}`,
      emailData.cc ? `Cc: ${emailData.cc}` : '',
      emailData.bcc ? `Bcc: ${emailData.bcc}` : '',
      `Subject: ${emailData.subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
    ].filter(line => line !== ''); // Remove empty lines (like cc/bcc if not provided)
    
    // Build the full message with an explicit empty line between headers and body
    const message = headers.join('\r\n') + '\r\n\r\n' + emailData.body;
    
    console.log('Email message structure:', {
      headersCount: headers.length,
      bodyLength: emailData.body.length,
      totalLength: message.length
    });
    
    // Encode the email in base64 URL-safe format with proper Unicode support
    // First convert string to UTF-8, then encode in base64
    let encodedMessage;
    try {
      // Use TextEncoder for UTF-8 encoding before base64 encoding
      const encoder = new TextEncoder();
      const uint8array = encoder.encode(message);
      encodedMessage = btoa(
        Array.from(uint8array, byte => String.fromCharCode(byte)).join('')
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch (encodeError) {
      console.error('Error encoding email message:', encodeError);
      return {
        success: false,
        error: 'Failed to encode email message. Please check for special characters.'
      };
    }
    
    // Send the email via Gmail API
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gmail API error response:', errorData);
      return { 
        success: false, 
        error: errorData.error?.message || 'Failed to send email' 
      };
    }
    
    const responseData = await response.json();
    return { 
      success: true, 
      messageId: responseData.id 
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: String(error) 
    };
  }
};

/**
 * Creates a draft email using Gmail API
 */
export const createGmailDraft = async (emailData: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): Promise<{ success: boolean; draftId?: string; error?: string }> => {
  const accessToken = getGoogleAccessToken();
  
  if (!accessToken) {
    return { success: false, error: 'Not authenticated with Google' };
  }
  
  try {
    // Format the email according to RFC 5322
    // IMPORTANT: The empty line between headers and body is crucial
    const headers = [
      `To: ${emailData.to}`,
      emailData.cc ? `Cc: ${emailData.cc}` : '',
      emailData.bcc ? `Bcc: ${emailData.bcc}` : '',
      `Subject: ${emailData.subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
    ].filter(line => line !== ''); // Remove empty lines (like cc/bcc if not provided)
    
    // Build the full message with an explicit empty line between headers and body
    const message = headers.join('\r\n') + '\r\n\r\n' + emailData.body;
    
    console.log('Draft email message structure:', {
      headersCount: headers.length,
      bodyLength: emailData.body.length,
      totalLength: message.length
    });
    
    // Encode the email in base64 URL-safe format with proper Unicode support
    // First convert string to UTF-8, then encode in base64
    let encodedMessage;
    try {
      // Use TextEncoder for UTF-8 encoding before base64 encoding
      const encoder = new TextEncoder();
      const uint8array = encoder.encode(message);
      encodedMessage = btoa(
        Array.from(uint8array, byte => String.fromCharCode(byte)).join('')
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch (encodeError) {
      console.error('Error encoding draft email message:', encodeError);
      return {
        success: false,
        error: 'Failed to encode draft email message. Please check for special characters.'
      };
    }
    
    // Create the draft email via Gmail API
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          raw: encodedMessage
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gmail API draft error response:', errorData);
      return { 
        success: false, 
        error: errorData.error?.message || 'Failed to create draft email' 
      };
    }
    
    const responseData = await response.json();
    return { 
      success: true, 
      draftId: responseData.id 
    };
  } catch (error) {
    console.error('Error creating draft email:', error);
    return { 
      success: false, 
      error: String(error) 
    };
  }
};

/**
 * Creates a calendar event using Google Calendar API
 */
export const createCalendarEvent = async (eventData: {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendees: string[];
  location?: string;
  timeZone?: string;
  authToken?: string;
}): Promise<{ 
  success: boolean; 
  eventId?: string; 
  eventLink?: string; 
  meetLink?: string; 
  raw?: any;
  error?: string 
}> => {
  // Use provided auth token or get from localStorage
  const accessToken = eventData.authToken || getGoogleAccessToken();
  
  if (!accessToken) {
    return { success: false, error: 'Not authenticated with Google' };
  }
  
  try {
    // Format the calendar event
    const event = {
      summary: eventData.title,
      location: eventData.location || 'Google Meet',
      description: eventData.description || '',
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      attendees: eventData.attendees.map(email => ({ email })),
      // Request Google Meet conference data
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          conferenceSolutionKey: { 
            type: 'hangoutsMeet' 
          }
        }
      }
    };
    
    console.log('Calendar event structure:', {
      title: eventData.title,
      startTime: eventData.startDateTime,
      endTime: eventData.endDateTime,
      attendeesCount: eventData.attendees.length
    });
    
    // Create the calendar event via Google Calendar API
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar API error response:', errorData);
      return { 
        success: false, 
        error: errorData.error?.message || 'Failed to create calendar event' 
      };
    }
    
    const responseData = await response.json();
    
    // Extract relevant information from the response
    const eventId = responseData.id;
    const eventLink = responseData.htmlLink;
    const meetLink = responseData.conferenceData?.entryPoints?.[0]?.uri || null;
    
    return { 
      success: true, 
      eventId: eventId,
      eventLink: eventLink,
      meetLink: meetLink,
      raw: responseData  // Include raw response for debugging
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { 
      success: false, 
      error: String(error) 
    };
  }
};