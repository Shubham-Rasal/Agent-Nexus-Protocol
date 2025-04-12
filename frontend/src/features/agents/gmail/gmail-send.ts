import { sendGmailEmail, isGoogleAuthenticated } from '@/services/googleAuth';

/**
 * Implementation of the Gmail Send Email tool for LlamaIndex integration
 */
export const gmailSend = async (params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}) => {
  console.log("Gmail Send Agent Tool - Params:", { 
    to: params.to,
    subject: params.subject, 
    bodyLength: params.body?.length || 0,
    hasCC: !!params.cc,
    hasBCC: !!params.bcc
  });
  
  // Check for auth token, either from global variable (server-side) or localStorage (client-side)
  const serverAuthToken = (global as any).__GMAIL_AUTH_TOKEN__;
  const isAuthenticated = serverAuthToken ? true : isGoogleAuthenticated();
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    console.error("Gmail Send Agent Tool - Not authenticated with Google");
    return {
      success: false,
      error: 'Not authenticated with Google. Please connect your Gmail account first.'
    };
  }
  
  // Validate required parameters
  if (!params.to) {
    console.error("Gmail Send Agent Tool - Missing recipient");
    return { success: false, error: 'Recipient email address is required.' };
  }
  
  if (!params.subject) {
    console.error("Gmail Send Agent Tool - Missing subject");
    return { success: false, error: 'Email subject is required.' };
  }
  
  if (!params.body) {
    console.error("Gmail Send Agent Tool - Missing body");
    return { success: false, error: 'Email body is required.' };
  }
  
  try {
    // Use server auth token if available
    if (serverAuthToken) {
      console.log("Gmail Send Agent Tool - Using server-side auth token");
    }
    
    // Format HTML email if the body doesn't already contain HTML tags
    const formattedBody = params.body.includes('<html') || params.body.includes('<body') || params.body.includes('<div')
      ? params.body // Already contains HTML
      : `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${params.body.replace(/\n/g, '<br>')}</div>`;
    
    console.log("Gmail Send Agent Tool - Formatted body:", {
      length: formattedBody.length,
      containsHtml: formattedBody.includes('<'),
      firstChars: formattedBody.substring(0, 50) + '...',
      lastChars: '...' + formattedBody.substring(formattedBody.length - 50)
    });
    
    // Send the email
    const result = await sendGmailEmail({
      to: params.to,
      subject: params.subject,
      body: formattedBody,
      cc: params.cc,
      bcc: params.bcc,
      authToken: serverAuthToken // Pass server auth token if available
    });
    
    console.log("Gmail Send Agent Tool - Result:", result);
    
    if (result.success) {
      return {
        success: true,
        messageId: result.messageId,
        message: `Email successfully sent to ${params.to}` + 
                 (params.cc ? ` with CC to ${params.cc}` : '') +
                 (params.bcc ? ` and BCC to ${params.bcc}` : ''),
        authSource: serverAuthToken ? 'server' : 'client' // For debugging
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to send email'
      };
    }
  } catch (error) {
    console.error("Gmail Send Agent Tool - Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 