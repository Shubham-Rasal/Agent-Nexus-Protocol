import { FunctionTool, OpenAI, OpenAIAgent } from "llamaindex";
import { gmailSendJSON, contactSearchJSON, emailTemplateJSON, meetingSchedulerJSON } from "./tools_config";
import { gmailSend } from "./gmail-send";
import { contactSearch } from "./contact-search";
import { emailTemplate } from "./email-template";
import { meetingScheduler } from "./meeting-scheduler";

// Create Gmail Send function tool
export const gmailSendTool = new FunctionTool(gmailSend as any, {
  name: "GmailSend", 
  description: "Use this function to send emails via Gmail",
  parameters: gmailSendJSON as any,
});

// Create Contact Search function tool
export const contactSearchTool = new FunctionTool(contactSearch as any, {
  name: "ContactSearch",
  description: "Use this function to search for contact information",
  parameters: contactSearchJSON as any,
});

// Create Email Template function tool
export const emailTemplateTool = new FunctionTool(emailTemplate as any, {
  name: "EmailTemplate",
  description: "Use this function to generate email content from templates",
  parameters: emailTemplateJSON as any,
});

// Create Meeting Scheduler function tool
export const meetingSchedulerTool = new FunctionTool(meetingScheduler as any, {
  name: "MeetingScheduler",
  description: "Use this function to schedule meetings through Google Calendar",
  parameters: meetingSchedulerJSON as any,
});

// Export all tools together for easy import
export const gmailTools = [
  gmailSendTool,
  contactSearchTool,
  emailTemplateTool,
  meetingSchedulerTool
];

// Create a standalone Gmail agent that can be imported and used
export const createGmailAgent = (apiKey: string, authToken?: string) => {
  // Pass auth token to tool instances if provided
  if (authToken) {
    // Store the auth token in a module-level variable that can be accessed by tools
    (global as any).__GMAIL_AUTH_TOKEN__ = authToken;
  }
  
  return new OpenAIAgent({
    llm: new OpenAI({
      model: "gpt-4o-mini",
      apiKey: apiKey,
      maxTokens: 5000,
      maxRetries: 1,
      supportToolCall: true,
    }),
    tools: gmailTools,
  });
}; 