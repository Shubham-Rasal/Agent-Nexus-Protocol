import { gmailSendTool } from './gmail-send';
import { akaveStorageTool } from './akave-storage';

/**
 * Registry of all available tool implementations
 */
export const toolRegistry: Record<string, Function> = {
  'gmail-send': gmailSendTool,
  'akave-storage': akaveStorageTool,
  // Add more tools here as they are implemented
};

/**
 * Generic tool executor that routes to the appropriate implementation
 */
export const executeTool = async (
  toolId: string,
  params: Record<string, any>
): Promise<any> => {
  // Check if the tool exists in the registry
  if (!toolRegistry[toolId]) {
    return {
      success: false,
      error: `Tool '${toolId}' not implemented or not found.`
    };
  }
  
  try {
    // Execute the tool with the provided parameters
    return await toolRegistry[toolId](params);
  } catch (error) {
    console.error(`Error executing tool '${toolId}':`, error);
    return {
      success: false,
      error: `Error executing tool: ${error}`
    };
  }
}; 