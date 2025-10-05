import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const FormattedResponseSchema = z.object({
  summary: z.string().describe("Brief summary of the query results"),
  keyFindings: z.array(z.string()).describe("List of key findings or entities"),
  formattedResults: z.array(z.object({
    description: z.string(),
    details: z.record(z.string(), z.any())
  })).describe("Formatted list of results")
})

export async function POST(req: Request) {
  try {
    const { results, originalQuery } = await req.json()
    
    if (!results) {
      return NextResponse.json({ error: 'Results are required' }, { status: 400 })
    }

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: FormattedResponseSchema,
      prompt: `Format these graph query results into a human-readable response.
Original query: ${originalQuery || 'None provided'}

Raw results (array of records): ${JSON.stringify(results)}

Provide a summary, key findings, and formatted results list.`
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error('Error formatting results:', error)
    return NextResponse.json({ error: 'Failed to format results' }, { status: 500 })
  }
}

