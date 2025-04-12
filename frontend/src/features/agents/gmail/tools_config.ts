// Gmail Send tool JSON schema
export const gmailSendJSON = {
  type: "object",
  properties: {
    to: {
      type: "string",
      description: "Email address of the recipient"
    },
    subject: {
      type: "string",
      description: "Subject line of the email"
    },
    body: {
      type: "string",
      description: "Email content/body in plain text or HTML format"
    },
    cc: {
      type: "string",
      description: "Email addresses to CC (optional, comma-separated)"
    },
    bcc: {
      type: "string",
      description: "Email addresses to BCC (optional, comma-separated)"
    }
  },
  required: ["to", "subject", "body"]
};

// Gmail Draft tool JSON schema
export const gmailDraftJSON = {
  type: "object",
  properties: {
    to: {
      type: "string",
      description: "Email address of the recipient"
    },
    subject: {
      type: "string",
      description: "Subject line of the email draft"
    },
    body: {
      type: "string",
      description: "Email content/body in plain text or HTML format"
    },
    cc: {
      type: "string",
      description: "Email addresses to CC (optional, comma-separated)"
    },
    bcc: {
      type: "string",
      description: "Email addresses to BCC (optional, comma-separated)"
    }
  },
  required: ["to", "subject", "body"]
};

// Contact Search tool JSON schema
export const contactSearchJSON = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "Search query to find contact information (name, company, position, etc.)"
    },
    source: {
      type: "string",
      description: "Source to search for contacts (e.g., 'gmail', 'crm', 'linkedin')",
      enum: ["gmail", "crm", "linkedin", "all"]
    },
    maxResults: {
      type: "number",
      description: "Maximum number of results to return"
    }
  },
  required: ["query"]
};

// Email Template tool JSON schema
export const emailTemplateJSON = {
  type: "object",
  properties: {
    templateType: {
      type: "string",
      description: "Type of email template to use",
      enum: ["introduction", "follow-up", "proposal", "meeting-request", "thank-you", "custom"]
    },
    recipient: {
      type: "object",
      description: "Information about the recipient",
      properties: {
        name: {
          type: "string",
          description: "Recipient's name"
        },
        company: {
          type: "string",
          description: "Recipient's company"
        },
        position: {
          type: "string",
          description: "Recipient's job position"
        }
      },
      required: ["name"]
    },
    sender: {
      type: "object",
      description: "Information about the sender",
      properties: {
        name: {
          type: "string",
          description: "Sender's name"
        },
        company: {
          type: "string",
          description: "Sender's company"
        },
        position: {
          type: "string",
          description: "Sender's job position"
        }
      }
    },
    customContent: {
      type: "string",
      description: "Custom content or specific details to include in the template"
    },
    tone: {
      type: "string",
      description: "Tone of the email",
      enum: ["formal", "casual", "friendly", "professional"]
    }
  },
  required: ["templateType", "recipient"]
};

// Meeting Scheduler tool JSON schema
export const meetingSchedulerJSON = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Title of the meeting"
    },
    description: {
      type: "string",
      description: "Description or agenda of the meeting (optional)"
    },
    date: {
      type: "string",
      description: "Date of the meeting in YYYY-MM-DD format"
    },
    startTime: {
      type: "string",
      description: "Start time of the meeting in HH:MM format (24-hour)"
    },
    endTime: {
      type: "string",
      description: "End time of the meeting in HH:MM format (24-hour)"
    },
    attendees: {
      type: "array",
      description: "List of email addresses of meeting attendees",
      items: {
        type: "string"
      }
    },
    location: {
      type: "string",
      description: "Location of the meeting (physical address or virtual meeting link name)"
    },
    timezone: {
      type: "string",
      description: "Timezone for the meeting (e.g., 'America/New_York', 'UTC')"
    }
  },
  required: ["title", "date", "startTime", "endTime", "attendees"]
}; 