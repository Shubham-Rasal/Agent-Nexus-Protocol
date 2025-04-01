import axios from 'axios';
import Papa from 'papaparse';

/**
 * Implementation of the CSV Processor tool using Lilypad LLM API
 * 
 * This tool allows users to:
 * 1. Load CSV data from a URL
 * 2. Process and transform the data using Lilypad LLM API
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
    const model = params.model || 'llama3.1:8b';
    
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

    // Step 4: Call the Lilypad LLM API using the same approach as in route.ts
    let transformedData;
    try {
      const API_URL = process.env.NEXT_PUBLIC_LILYPAD_API_URL || "https://anura-testnet.lilypad.tech/api/v1/chat/completions";
      const API_TOKEN = process.env.NEXT_PUBLIC_LILYPAD_API_KEY || process.env.LILYPAD_API_TOKEN;
      
      if (!API_TOKEN) {
        return { success: false, error: 'Lilypad API key is not configured' };
      }
      
      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ];

      const requestBody = {
        model: model,
        messages,
        max_tokens: 4000,
        temperature: 0.2,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`LLM API request failed with status ${response.status}`);
      }

      const result = await response.json();
      
      if (result.choices && result.choices[0] && result.choices[0].message?.content) {
        transformedData = result.choices[0].message.content.trim();
      } else {
        throw new Error('Invalid response format from LLM API');
      }
    } catch (error) {
      console.error('Error calling Lilypad LLM API:', error);
      return { 
        success: false, 
        error: `Failed to transform data with LLM: ${error instanceof Error ? error.message : String(error)}`
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
                  error: 'Failed to extract valid JSON from LLM response' 
                };
              }
            } else {
              return { 
                success: false, 
                error: 'Failed to extract valid JSON from LLM response' 
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
                    error: 'Failed to extract valid data from LLM response' 
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
    } catch (error) {
      console.error('Error processing transformed data:', error);
      return { 
        success: false, 
        error: `Failed to process transformed data: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    
    // Step 6: Create a downloadable URL for the transformed data
    let outputUrl = '';
    try {
      const blob = new Blob(
        [outputFormat === 'json' ? JSON.stringify(outputData, null, 2) : outputData], 
        { type: outputFormat === 'json' ? 'application/json' : 'text/csv' }
      );
      outputUrl = URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating downloadable URL:', error);
      // This is not a critical error, so we'll continue
    }
    
    // Return the processed data and download URL
    return {
      success: true,
      data: outputData,
      outputUrl
    };
  } catch (error) {
    console.error('Unexpected error in CSV Processor tool:', error);
    return { 
      success: false, 
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}; 