import { FunctionTool, OpenAI, OpenAIAgent } from "llamaindex";
import { akaveStorageTool } from "./akave-storage";
import { leadQualificationTool } from "./qualify-tool";
import { akaveStorageJSON, leadQualificationJSON, websearchJSON } from "./toots_config";
import { websearch } from "./web-search";
  // Create websearch function tool
  export const lilyPadsWebSearch = new FunctionTool(websearch, {
    name: "LilyPadsWebSearch",
    description: "Use this function to search the web for information",
    parameters: websearchJSON,
  });

// Create Akave Storage function tool
export const akaveStorage = new FunctionTool(akaveStorageTool, {
  name: "akaveStorage",
  description: "Use this function to interact with Akave Decentralized Storage in the 'myBucket' bucket (list files, get file info, download files, upload files)",
  parameters: akaveStorageJSON,
});



// Create Lead Qualification function tool
export const leadQualification = new FunctionTool(leadQualificationTool, {
  name: "leadQualification",
  description: "Evaluate if a lead is qualified based on having valid contact information (email, LinkedIn, or GitHub)",
  parameters: leadQualificationJSON,
});

