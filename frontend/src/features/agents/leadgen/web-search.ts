// Define a function to search the web
export async function websearch(params: {query: string, numberOfResults: number}) {
    const myHeaders = new Headers();
    myHeaders.append("authorization", "Bearer " + "anr_10b20b1dffe3e538fbfdf92c953ee0af2c359e47dd8b3837362fa057c9b7dc9d");
    myHeaders.append("content-type", "application/json");

    const raw = JSON.stringify({
      "query": params.query,
      "number_of_results": params.numberOfResults
    });
  
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
  
    try {
      const response = await fetch("https://anura-testnet.lilypad.tech/api/v1/websearch", {
        ...requestOptions,
        redirect: 'follow' as RequestRedirect
      });
      const result = await response.json();
      return result;
    } catch (error: unknown) {
      console.error("Error searching the web:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "An unknown error occurred" };
    }
  }