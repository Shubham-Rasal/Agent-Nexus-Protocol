/**
 * Implementation of the Email Template tool for LlamaIndex integration
 * Generates email content based on templates and recipient/sender information
 */
export const emailTemplate = async (params: {
  templateType: "introduction" | "follow-up" | "proposal" | "meeting-request" | "thank-you" | "custom";
  recipient: {
    name: string;
    company?: string;
    position?: string;
  };
  sender?: {
    name?: string;
    company?: string;
    position?: string;
  };
  customContent?: string;
  tone?: "formal" | "casual" | "friendly" | "professional";
}) => {
  console.log("Email Template Agent Tool - Params:", params);
  
  // Validate required parameters
  if (!params.templateType) {
    console.error("Email Template Agent Tool - Missing template type");
    return { success: false, error: 'Template type is required.' };
  }
  
  if (!params.recipient || !params.recipient.name) {
    console.error("Email Template Agent Tool - Missing recipient name");
    return { success: false, error: 'Recipient name is required.' };
  }
  
  try {
    // Default values
    const tone = params.tone || "professional";
    const sender = params.sender || { name: "Me" };
    
    // Build greeting based on tone
    let greeting = "";
    switch (tone) {
      case "formal":
        greeting = `Dear ${params.recipient.name},`;
        break;
      case "professional":
        greeting = `Hello ${params.recipient.name},`;
        break;
      case "friendly":
      case "casual":
        greeting = `Hi ${params.recipient.name},`;
        break;
      default:
        greeting = `Hello ${params.recipient.name},`;
    }
    
    // Build introduction based on sender info
    let introduction = "";
    if (sender.name && sender.company && sender.position) {
      introduction = `I'm ${sender.name}, ${sender.position} at ${sender.company}.`;
    } else if (sender.name && sender.company) {
      introduction = `I'm ${sender.name} from ${sender.company}.`;
    } else if (sender.name) {
      introduction = `I'm ${sender.name}.`;
    }
    
    // Build recipient context if company/position is available
    let recipientContext = "";
    if (params.recipient.company && params.recipient.position) {
      recipientContext = ` as the ${params.recipient.position} at ${params.recipient.company}`;
    } else if (params.recipient.company) {
      recipientContext = ` at ${params.recipient.company}`;
    } else if (params.recipient.position) {
      recipientContext = ` in your role as ${params.recipient.position}`;
    }
    
    // Build the main content based on template type
    let mainContent = "";
    switch (params.templateType) {
      case "introduction":
        mainContent = `I wanted to reach out and introduce myself${introduction ? ": " + introduction : "."} I recently became aware of your work${recipientContext} and I'm impressed with what you're doing.`;
        if (params.customContent) {
          mainContent += `\n\n${params.customContent}`;
        } else {
          mainContent += "\n\nI'd love to connect and explore potential opportunities to work together.";
        }
        break;
        
      case "follow-up":
        mainContent = `I'm following up on our previous conversation${recipientContext ? recipientContext : ""}.`;
        if (params.customContent) {
          mainContent += `\n\n${params.customContent}`;
        } else {
          mainContent += "\n\nI wanted to check in and see if you've had a chance to consider what we discussed. I'm happy to provide any additional information that might be helpful.";
        }
        break;
        
      case "proposal":
        mainContent = `I'm writing to submit a proposal for your consideration${recipientContext ? recipientContext : ""}.`;
        if (params.customContent) {
          mainContent += `\n\n${params.customContent}`;
        } else {
          mainContent += "\n\nBased on our previous discussions, I believe we can provide significant value through our collaboration. I've outlined the key points below, but I'm happy to elaborate further or make adjustments based on your feedback.";
        }
        break;
        
      case "meeting-request":
        mainContent = `I would like to schedule a meeting with you${recipientContext ? recipientContext : ""} to discuss potential collaboration.`;
        if (params.customContent) {
          mainContent += `\n\n${params.customContent}`;
        } else {
          mainContent += "\n\nI'm available at your convenience next week. Please let me know what times work best for you, and I'll be happy to arrange the meeting.";
        }
        break;
        
      case "thank-you":
        mainContent = `I wanted to express my sincere thanks for your time and consideration${recipientContext ? recipientContext : ""}.`;
        if (params.customContent) {
          mainContent += `\n\n${params.customContent}`;
        } else {
          mainContent += "\n\nI greatly appreciate our conversation and look forward to the possibility of working together in the future.";
        }
        break;
        
      case "custom":
        if (params.customContent) {
          mainContent = params.customContent;
        } else {
          mainContent = "I'm reaching out regarding our potential collaboration. I look forward to discussing this further with you.";
        }
        break;
        
      default:
        mainContent = params.customContent || "I'm reaching out regarding our potential collaboration. I look forward to discussing this further with you.";
    }
    
    // Build closing based on tone
    let closing = "";
    switch (tone) {
      case "formal":
        closing = "Sincerely,";
        break;
      case "professional":
        closing = "Best regards,";
        break;
      case "friendly":
        closing = "All the best,";
        break;
      case "casual":
        closing = "Cheers,";
        break;
      default:
        closing = "Regards,";
    }
    
    // Assemble the email
    const emailContent = `${greeting}\n\n${mainContent}\n\n${closing}\n${sender.name}${sender.position ? "\n" + sender.position : ""}${sender.company ? (sender.position ? "" : "\n") + sender.company : ""}`;
    
    // Generate a subject line based on template type
    let subject = "";
    switch (params.templateType) {
      case "introduction":
        subject = `Introduction: ${sender.name || "New connection"} ${sender.company ? "from " + sender.company : ""}`;
        break;
      case "follow-up":
        subject = "Following up on our conversation";
        break;
      case "proposal":
        subject = `Proposal for ${params.recipient.company || "your consideration"}`;
        break;
      case "meeting-request":
        subject = "Request for a meeting";
        break;
      case "thank-you":
        subject = "Thank you for your time";
        break;
      case "custom":
        subject = "Regarding our potential collaboration";
        break;
      default:
        subject = "Regarding our potential collaboration";
    }
    
    return {
      success: true,
      emailContent: {
        subject: subject,
        body: emailContent
      },
      message: `Generated ${params.templateType} email template for ${params.recipient.name}`
    };
  } catch (error) {
    console.error("Email Template Agent Tool - Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 