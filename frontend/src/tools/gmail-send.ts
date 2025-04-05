import { sendGmailEmail, isGoogleAuthenticated } from '@/services/googleAuth';

/**
 * Implementation of the Gmail Send Email tool
 */
export const gmailSendTool = async (params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  console.log("Gmail Send Tool - Params:", { 
    to: params.to,
    subject: params.subject, 
    bodyLength: params.body?.length || 0,
    hasCC: !!params.cc,
    hasBCC: !!params.bcc
  });
  
  // Check if user is authenticated
  if (!isGoogleAuthenticated()) {
    console.error("Gmail Send Tool - Not authenticated with Google");
    return {
      success: false,
      error: 'Not authenticated with Google. Please connect your Gmail account first.'
    };
  }
  
  // Validate required parameters
  if (!params.to) {
    console.error("Gmail Send Tool - Missing recipient");
    return { success: false, error: 'Recipient email address is required.' };
  }
  
  if (!params.subject) {
    console.error("Gmail Send Tool - Missing subject");
    return { success: false, error: 'Email subject is required.' };
  }
  
  if (!params.body) {
    console.error("Gmail Send Tool - Missing body");
    return { success: false, error: 'Email body is required.' };
  }
  
  try {
    // Format HTML email if the body doesn't already contain HTML tags
    const formattedBody = params.body.includes('<html') || params.body.includes('<body') || params.body.includes('<div')
      ? params.body // Already contains HTML
      : `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${params.body.replace(/\n/g, '<br>')}</div>`;
    
    console.log("Gmail Send Tool - Formatted body:", {
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
      bcc: params.bcc
    });
    
    console.log("Gmail Send Tool - Result:", result);
    return result;
  } catch (error) {
    console.error("Gmail Send Tool - Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 