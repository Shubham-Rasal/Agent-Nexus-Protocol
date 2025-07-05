/* eslint-disable */
// @ts-nocheck
import { NextResponse, NextRequest } from 'next/server'
import { GraphData } from '@/components/data/sampleGraphData'
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
}


export async function GET(
  request: Request,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid } = await params
    // Fetch graph data from IPFS using the CID
    const response = await fetch(`https://0x23178ccd27cda5d5d18b211ad6648e189c1e16e1.calibration.filcdn.io/${cid}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data: IPFSGraphData = await response.json()

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
      }
    } = { 
      nodes, 
      links,
      metadata: {
        nodeTypes: Array.from(nodeTypes),
        relationTypes: Array.from(relationTypes),
        timestamp: data.timestamp,
        version: data.version
      }
    }

    return NextResponse.json(graphData)
  } catch (error) {
    console.error('Error fetching graph data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch graph data' },
      { status: 500 }
    )
  }
}
