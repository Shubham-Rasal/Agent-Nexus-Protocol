// Define a function to search the web
export async function websearch(params: {query: string, numberOfResults: number}) {
  const SERPER_API_KEY = process.env.SERPER_API_KEY;
    
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": SERPER_API_KEY,
      },
      body: JSON.stringify({
        q: params.query,
        num: params.numberOfResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the response to match the expected format
    const results = data.organic.map((result: any) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
    }));

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Error performing web search:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
}