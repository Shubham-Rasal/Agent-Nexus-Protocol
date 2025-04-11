export const meetingRequestSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "Title/summary of the meeting"
    },
    attendees: {
      type: "array",
      items: {
        type: "string"
      },
      description: "List of attendee email addresses"
    },
    duration: {
      type: "number",
      description: "Duration of meeting in minutes"
    },
    startTime: {
      type: "string",
      description: "ISO string of meeting start time"
    },
    description: {
      type: "string",
      description: "Optional description/agenda for the meeting"
    },
    location: {
      type: "string",
      description: "Optional location for the meeting"
    }
  },
  required: ["summary", "attendees", "duration", "startTime"],
  additionalProperties: false
}; 