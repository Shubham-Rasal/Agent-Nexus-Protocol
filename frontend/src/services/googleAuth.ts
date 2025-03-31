// Google OAuth and Gmail API Integration

// These would typically come from environment variables
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly', // For reading emails
  'https://www.googleapis.com/auth/userinfo.email', // For user info
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
  // Check if token exists and is not expired
  const token = localStorage.getItem(AUTH_STORAGE_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryTime) {
    return false;
  }
  
  // Check if token is expired
  const now = Date.now();
  return now < parseInt(expiryTime);
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