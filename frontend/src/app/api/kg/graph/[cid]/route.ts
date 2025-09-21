/* eslint-disable */
// @ts-nocheck
import { NextResponse, NextRequest } from 'next/server'
import { GraphData } from '@/components/data/sampleGraphData'
import { analyzeContent, ContentInfo } from '@/lib/contentTypeDetection'
export const dynamic = 'force-dynamic'

interface IPFSNode {
  id: string;
  entityType: string;
  name: string;
  properties: Record<string, any>;
  observations: string[];
}

interface IPFSEdge {
  id: string;
  from: string;
  to: string;
  relationType: string;
  properties: Record<string, any>;
}

interface IPFSGraphData {
  nodes: Record<string, IPFSNode>;
  edges: Record<string, IPFSEdge>;
  timestamp: number;
  version: string;
  provenance?: Array<{
    action: string;
    objectType: string;
    id: string;
    timestamp: number;
  }>;
}


export async function GET(
  request: Request,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid } = await params
    // Fetch content from IPFS using the CID
    const response = await fetch(`https://0x23178ccd27cda5d5d18b211ad6648e189c1e16e1.calibration.filcdn.io/${cid}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // Get the raw content as text first
    const rawContent = await response.text()
    
    // Analyze the content to determine its type
    const contentInfo = analyzeContent(rawContent)
    
    // If it's not graph data, return the content info for appropriate rendering
    if (!contentInfo.isGraphData) {
      return NextResponse.json({
        contentType: contentInfo.type,
        isGraphData: false,
        content: contentInfo.rawContent,
        parsedContent: contentInfo.parsedContent
      })
    }
    
    // If it's graph data, parse and process as before
    const data: IPFSGraphData = contentInfo.parsedContent

    // Infer unique node types and relation types
    const nodeTypes = new Set<string>()
    const relationTypes = new Set<string>()

    // Extract node types
    Object.values(data.nodes).forEach(node => {
      nodeTypes.add(node.entityType)
    })

    // Extract relation types
    Object.values(data.edges).forEach(edge => {
      relationTypes.add(edge.relationType)
    })

    // Convert the IPFS data to our GraphData format
    const nodes = Object.values(data.nodes).map(node => ({
      id: node.id,
      name: node.name,
      type: node.entityType,
      properties: {
        ...node.properties,
        observations: node.observations
      }
    }))

    const links = Object.values(data.edges).map(edge => ({
      source: edge.from,
      target: edge.to,
      type: edge.relationType,
      properties: edge.properties
    }))

    const graphData: GraphData & { 
      metadata: {
        nodeTypes: string[];
        relationTypes: string[];
        timestamp: number;
        version: string;
        provenance?: Array<{
          action: string;
          objectType: string;
          id: string;
          timestamp: number;
        }>;
      }
    } = { 
      nodes, 
      links,
      metadata: {
        nodeTypes: Array.from(nodeTypes),
        relationTypes: Array.from(relationTypes),
        timestamp: data.timestamp,
        version: data.version,
        provenance: data.provenance || []
      }
    }

    return NextResponse.json({
      contentType: 'json',
      isGraphData: true,
      ...graphData
    })
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}
