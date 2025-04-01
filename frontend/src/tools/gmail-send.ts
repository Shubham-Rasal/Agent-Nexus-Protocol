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
  // Check if user is authenticated
  if (!isGoogleAuthenticated()) {
    return {
      success: false,
      error: 'Not authenticated with Google. Please connect your Gmail account first.'
    };
  }
  
  // Validate required parameters
  if (!params.to) {
    return { success: false, error: 'Recipient email address is required.' };
  }
  
  if (!params.subject) {
    return { success: false, error: 'Email subject is required.' };
  }
  
  if (!params.body) {
    return { success: false, error: 'Email body is required.' };
  }
  
  // Format HTML email if the body doesn't already contain HTML tags
  const formattedBody = params.body.includes('<html') || params.body.includes('<body') || params.body.includes('<div')
    ? params.body // Already contains HTML
    : `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${params.body.replace(/\n/g, '<br>')}</div>`;
  
  // Send the email
  return await sendGmailEmail({
    to: params.to,
    subject: params.subject,
    body: formattedBody,
    cc: params.cc,
    bcc: params.bcc
  });
}; 