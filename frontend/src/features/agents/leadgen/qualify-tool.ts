
export async function leadQualificationTool(params: {
  leadInfo: {
    email?: string;
    linkedIn?: string;
    gitHub?: string;
  }
}): Promise<{ success: boolean; error?: string; data?: any }> {
  // Validate required parameters
  if (!params.leadInfo) {
    return { 
      success: false, 
      error: 'Lead information is required.' 
    };
  }

  try {
    // Extract lead information
    const lead = params.leadInfo;
    
    // Check if email, LinkedIn, or GitHub link is available
    const hasEmail = lead.email && typeof lead.email === 'string' && lead.email.trim() !== '';
    const hasLinkedIn = lead.linkedIn && typeof lead.linkedIn === 'string' && lead.linkedIn.trim() !== '';
    const hasGitHub = lead.gitHub && typeof lead.gitHub === 'string' && lead.gitHub.trim() !== '';
    
    // Lead is qualified if any of the contact methods are available
    const isQualified = hasEmail || hasLinkedIn || hasGitHub;
    
    // Generate qualification details
    const qualificationDetails = [];
    if (hasEmail) qualificationDetails.push('Email available');
    if (hasLinkedIn) qualificationDetails.push('LinkedIn profile available');
    if (hasGitHub) qualificationDetails.push('GitHub profile available');
    
    // Generate recommendation based on qualification
    const recommendation = isQualified 
      ? `Lead is qualified with the following contact methods: ${qualificationDetails.join(', ')}.`
      : 'Lead is not qualified. No email, LinkedIn, or GitHub information provided.';
    
    return {
      success: true,
      data: {
        isQualified,
        hasEmail,
        hasLinkedIn,
        hasGitHub,
        recommendation
      }
    };
  } catch (error) {
    console.error('Error qualifying lead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during lead qualification'
    };
  }
}