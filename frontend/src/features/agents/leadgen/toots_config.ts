
// Websearch properties to give to the LLM
export const websearchJSON = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query",
      },
      numberOfResults: {
        type: "number",
        description: "Number of search results to return (default: 3)",
      },
    },
    required: ["query"],
  };
  

  
  // Akave Storage properties to give to the LLM
  export const akaveStorageJSON = {
    type: "object",
    properties: {
      operation: {
        type: "string",
        description: "Operation to perform: 'list', 'info', 'download', or 'upload'",
        enum: ["list", "info", "download", "upload"]
      },
      fileName: {
        type: "string",
        description: "Name of the file (required for info, download, and upload operations)"
      },
      fileData: {
        type: "string",
        description: "Base64 encoded file content (required for upload operation)"
      },
      fileType: {
        type: "string",
        description: "MIME type of the file (required for upload operation)"
      }
    },
    required: ["operation"]
  };

  // Lead Qualification properties to give to the LLM
export const leadQualificationJSON = {
    type: "object",
    properties: {
      leadInfo: {
        type: "object",
        description: "Contact information about the lead to be qualified",
        properties: {
          email: { type: "string", description: "Lead's email address" },
          linkedIn: { type: "string", description: "Lead's LinkedIn profile URL" },
          gitHub: { type: "string", description: "Lead's GitHub profile URL" }
        }
      }
    },
    required: ["leadInfo"]
  };