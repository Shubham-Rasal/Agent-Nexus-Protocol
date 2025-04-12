import { isGoogleAuthenticated } from '@/services/googleAuth';

// Sample contacts data (this would be replaced with actual API calls in a real implementation)
const sampleContacts = [
  {
    name: "John Smith",
    email: "john.smith@example.com",
    company: "Acme Inc.",
    position: "Chief Technology Officer",
    lastContact: "2023-11-15"
  },
  {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    company: "TechCorp",
    position: "Marketing Director",
    lastContact: "2023-12-01"
  },
  {
    name: "Michael Johnson",
    email: "michael.johnson@example.com",
    company: "Global Solutions",
    position: "Sales Manager",
    lastContact: "2024-01-10"
  },
  {
    name: "Sara Williams",
    email: "sara.williams@example.com",
    company: "InnovateX",
    position: "Product Manager",
    lastContact: "2024-02-15"
  }
];

/**
 * Implementation of the Contact Search tool for LlamaIndex integration
 * Searches for contact information based on the provided query
 */
export const contactSearch = async (params: {
  query: string;
  source?: string;
  maxResults?: number;
}) => {
  console.log("Contact Search Agent Tool - Params:", params);
  
  // Check for auth token, either from global variable (server-side) or localStorage (client-side)
  const serverAuthToken = (global as any).__GMAIL_AUTH_TOKEN__;
  const isAuthenticated = serverAuthToken ? true : isGoogleAuthenticated();
  
  // Check if user is authenticated
  if (!isAuthenticated && (params.source === 'gmail' || params.source === 'all')) {
    console.error("Contact Search Agent Tool - Not authenticated with Google");
    return {
      success: false,
      error: 'Not authenticated with Google. Please connect your Gmail account first.'
    };
  }
  
  // Validate required parameters
  if (!params.query) {
    console.error("Contact Search Agent Tool - Missing query");
    return { success: false, error: 'Search query is required.' };
  }
  
  try {
    // In a real implementation, this would call relevant APIs based on the source
    // For demo purposes, we're using the sample data and simple filtering
    
    const maxResults = params.maxResults || 5;
    const queryLower = params.query.toLowerCase();
    
    // Simple search algorithm - match any part of the contact data
    const filteredContacts = sampleContacts.filter(contact => {
      const contactString = JSON.stringify(contact).toLowerCase();
      return contactString.includes(queryLower);
    }).slice(0, maxResults);
    
    if (filteredContacts.length === 0) {
      return {
        success: true,
        contacts: [],
        message: `No contacts found matching query "${params.query}"`
      };
    }
    
    return {
      success: true,
      contacts: filteredContacts,
      count: filteredContacts.length,
      message: `Found ${filteredContacts.length} contact(s) matching query "${params.query}"`
    };
  } catch (error) {
    console.error("Contact Search Agent Tool - Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 