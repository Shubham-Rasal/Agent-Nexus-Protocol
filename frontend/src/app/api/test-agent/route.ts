import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  const { systemPrompt, query, llmProvider } = await req.json();

  try {
    let response = "";

    if (llmProvider === "google") {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
      });
      const result = await generateText({
        model: google("models/gemini-2.5-flash"),
        system: systemPrompt,
        prompt: query,
      });
      response = result.text;
    } else if (llmProvider === "openai") {
      const result = await generateText({
        model: openai("gpt-4.1-mini"),
        system: systemPrompt,
        prompt: query,
      });
      response = result.text;
    } else {
      response = `Provider "${llmProvider}" is not yet supported for agent testing.`;
    }

    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json(
      { response: `Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
