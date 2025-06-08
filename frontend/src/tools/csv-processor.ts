import axios from 'axios';
import Papa from 'papaparse';
import { OpenAIClient } from '@/lib/openai';

/**
 * Implementation of the CSV Processor tool using OpenAI API
 * 
 * This tool allows users to:
 * 1. Load CSV data from a URL
 * 2. Process and transform the data using OpenAI API
 * 3. Output the transformed data
 */
export const csvProcessorTool = async (params: {
  inputUrl: string;
  systemPrompt: string;
  outputFormat?: 'csv' | 'json';
  maxRows?: number;
  model?: string;
}): Promise<{ success: boolean; error?: string; data?: any; outputUrl?: string }> => {
  try {
    // Validate required parameters
    if (!params.inputUrl) {
      return { success: false, error: 'Input URL is required' };
    }
    
    if (!params.systemPrompt) {
      return { success: false, error: 'System prompt is required' };
    }
    
    // Set defaults
    const outputFormat = params.outputFormat || 'csv';
    const maxRows = params.maxRows || 1000;
    const model = params.model || 'gpt-3.5-turbo-16k';
    
    // Step 1: Fetch the CSV file from the URL
    let csvData;
    try {
      const response = await axios.get(params.inputUrl);
      csvData = response.data;
    } catch (error) {
      console.error('Error fetching CSV file:', error);
      return { 
        success: false, 
        error: `Failed to fetch CSV file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    
    // Step 2: Parse the CSV data
    let parsedData;
    try {
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true
      });
      
      // Limit the number of rows to prevent large payloads
      parsedData = parseResult.data.slice(0, maxRows);
      
      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings:', parseResult.errors);
      }
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      return { 
        success: false, 
        error: `Failed to parse CSV data: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    
    // Step 3: Prepare data for the LLM
    // Extract column headers and a sample of the data for context
    const headers = Object.keys(parsedData[0] || {});
    const sampleData = parsedData.slice(0, 5);
    
    // Create a structured prompt for the LLM
    const systemPrompt = `You are an expert CSV data transformer.
Your task is to transform CSV data according to specific instructions.
You will receive a CSV dataset with headers and rows, and instructions for how to transform it.

The output format should be ${outputFormat === 'json' ? 'JSON array' : 'CSV with headers'}.

Please follow these rules:
1. Transform the data exactly as instructed
2. Return ONLY the transformed data without any explanation or additional text
3. Ensure all data is properly formatted
4. Maintain data types where appropriate
5. For CSV output, include a header row

Respond ONLY with the transformed data in the requested format.`;

    const userPrompt = `I need you to transform this CSV data according to the following instructions:

${params.systemPrompt}

Here are the columns in the original CSV:
${headers.join(", ")}

Here's a sample of the data (first 5 rows):
${JSON.stringify(sampleData, null, 2)}

Now, transform the following complete dataset according to the instructions above.
Output format: ${outputFormat === 'json' ? 'JSON array' : 'CSV with headers'}

Full dataset:
${JSON.stringify(parsedData, null, 2)}`;

    // Step 4: Call the OpenAI API
    let transformedData;
    try {
      const openai = new OpenAIClient();
      
      const response = await openai.chatCompletion({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        model: model,
        temperature: 0.2,
        maxTokens: 4000
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to get response from OpenAI');
      }

      transformedData = response.data.content?.trim();
      
      if (!transformedData) {
        throw new Error('Invalid response format from OpenAI API');
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return { 
        success: false, 
        error: `Failed to transform data with OpenAI: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    
    // Step 5: Process the transformed data based on the requested output format
    let outputData;
    try {
      if (outputFormat === 'json') {
        // If output is already JSON, parse it to ensure it's valid
        if (transformedData.startsWith('[') && transformedData.endsWith(']')) {
          outputData = JSON.parse(transformedData);
        } else {
          // Try to extract JSON array from the LLM response
          const jsonMatch = transformedData.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            outputData = JSON.parse(jsonMatch[0]);
          } else {
            // Final attempt: Try to extract with markdown code block
            const markdownMatch = transformedData.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (markdownMatch && markdownMatch[1]) {
              const potentialJson = markdownMatch[1].trim();
              if (potentialJson.startsWith('[') && potentialJson.endsWith(']')) {
                outputData = JSON.parse(potentialJson);
              } else {
                return { 
                  success: false, 
                  error: 'Failed to extract valid JSON from OpenAI response' 
                };
              }
            } else {
              return { 
                success: false, 
                error: 'Failed to extract valid JSON from OpenAI response' 
              };
            }
          }
        }
      } else {
        // For CSV output, we need to first determine if we got CSV or JSON from the LLM
        if (transformedData.includes(',') && transformedData.includes('\n')) {
          // Clean up CSV data - remove possible markdown code blocks
          const csvMatch = transformedData.match(/```(?:csv)?\s*([\s\S]*?)```/);
          if (csvMatch && csvMatch[1]) {
            outputData = csvMatch[1].trim();
          } else {
            outputData = transformedData.trim();
          }
        } else {
          // Try to parse as JSON and convert to CSV
          try {
            let jsonData;
            if (transformedData.startsWith('[') && transformedData.endsWith(']')) {
              jsonData = JSON.parse(transformedData);
            } else {
              // Try to extract from markdown code block
              const markdownMatch = transformedData.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (markdownMatch && markdownMatch[1]) {
                const potentialJson = markdownMatch[1].trim();
                if (potentialJson.startsWith('[') && potentialJson.endsWith(']')) {
                  jsonData = JSON.parse(potentialJson);
                } else {
                  return { 
                    success: false, 
                    error: 'Failed to extract valid JSON data for CSV conversion' 
                  };
                }
              } else {
                // Last attempt with regex
                const jsonMatch = transformedData.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (jsonMatch) {
                  jsonData = JSON.parse(jsonMatch[0]);
                } else {
                  return { 
                    success: false, 
                    error: 'Failed to extract valid data from OpenAI response' 
                  };
                }
              }
            }
            
            // Convert JSON back to CSV
            outputData = Papa.unparse(jsonData);
          } catch (error) {
            return { 
              success: false, 
              error: `Failed to process transformed data: ${error instanceof Error ? error.message : String(error)}` 
            };
          }
        }
      }
      
      return {
        success: true,
        data: outputData
      };
    } catch (error) {
      console.error('Error processing transformed data:', error);
      return { 
        success: false, 
        error: `Failed to process transformed data: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  } catch (error) {
    console.error('Error in CSV processor:', error);
    return { 
      success: false, 
      error: `CSV processing failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}; 