import { NextRequest, NextResponse } from 'next/server'
import { createGraphDB } from '@shubhamrasal/groundline'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ adapter: string }> }
) {
  try {
    const { adapter } = await params
    const { query } = await request.json()

    if (!adapter || !query) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate adapter type
    if (!['wikidata', 'dbpedia', 'openalex'].includes(adapter)) {
      return NextResponse.json(
        { error: 'Invalid adapter type' },
        { status: 400 }
      )
    }

    // Initialize graph database with the specified adapter
    const graphDB = createGraphDB({
      enabledAdapters: [adapter as 'wikidata' | 'dbpedia' | 'openalex']
    })

    await graphDB.initialize()
    
    // Import data from external knowledge graph
    const results = await graphDB.importExternalKG(adapter, query)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import graph' },
      { status: 500 }
    )
  }
} 