import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import db from 'neo4j-driver';
import { RPC_URLS, Synapse } from '@filoz/synapse-sdk';
import { FileChunker } from '@/lib/file-chunker';
import neo4j from 'neo4j-driver';

// Define schema for entities and relationships
const EntitySchema = z.object({
  id: z.string().describe("Unique identifier for the entity"),
  type: z.string().describe("Type of entity (e.g., Person, Concept, Organization)"),
  properties: z.record(z.string(), z.any()).describe("Key-value pairs of entity properties"),
});

const RelationshipSchema = z.object({
  from: z.string().describe("Source entity ID"),
  to: z.string().describe("Target entity ID"),
  type: z.string().describe("Type of relationship"),
  properties: z.record(z.string(), z.any()).optional().describe("Optional relationship properties"),
});

const KnowledgeGraphSchema = z.object({
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
});

const CypherQuerySchema = z.object({
  queries: z.array(z.object({
    cypher: z.string().describe("Cypher query string"),
    description: z.string().describe("What this query does"),
  })),
});

interface UploadResult {
  pieceCid: string;
  fileSize: number;
  fileName: string;
}

interface ProcessingStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  data?: any;
}

/**
 * Upload file to Filecoin Synapse storage
 */
async function uploadToSynapse(fileBuffer: Buffer, fileName: string): Promise<UploadResult> {
  const synapse = await Synapse.create({
    privateKey: process.env.SYNAPSE_PRIVATE_KEY || "0x8f3092541ef889aa7c0c6c3f81f0c607a63dc75204003b57c1ce2c51570b490c",
    rpcURL: RPC_URLS.calibration.http,
    withCDN: true
  });
  
  const context = await synapse.storage.createContext({
    dataSetId: parseInt(process.env.SYNAPSE_DATASET_ID || "24"),
    withCDN: true,
  });
  
  const needsChunking = FileChunker.needsChunking(fileBuffer.length);
  
  if (needsChunking) {
    const { chunks, metadata } = await FileChunker.splitFile(fileBuffer, fileName);
    const uploadResults = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      const chunkMetadata = {
        "title": fileName,
        "description": "Knowledge Graph Source",
        "type": "markdown",
        "chunk_index": String(chunk.index),
        "total_chunks": String(chunk.totalChunks),
        "original_filename": chunk.originalFileName,
        "chunk_hash": chunk.chunkHash,
        "original_hash": chunk.originalFileHash || ''
      };
      
      const uploadResult = await context.upload(chunk.chunkData, {
        metadata: chunkMetadata,
      });
      
      uploadResults.push({
        chunkIndex: chunk.index,
        pieceCid: uploadResult.pieceCid.toString(),
      });
    }
    
    return {
      pieceCid: uploadResults[0].pieceCid, // Return first chunk CID as reference
      fileSize: metadata.originalFileSize,
      fileName: metadata.originalFileName
    };
    
  } else {
    const uploadResult = await context.upload(fileBuffer, {
      metadata: {
        "title": fileName,
        "description": "Knowledge Graph Source",
        "type": "markdown"
      },
    });
    
    return {
      pieceCid: uploadResult.pieceCid.toString(),
      fileSize: fileBuffer.length,
      fileName
    };
  }
}

/**
 * Parse markdown content and extract entities and relationships using AI
 */
async function parseMarkdownToKG(content: string) {
  const result = await generateObject({
    model: openai('gpt-4o'),
    schemaName: 'knowledgeGraph',
    schemaDescription: 'Entities and relationships extracted from markdown content',
    schema: KnowledgeGraphSchema,
    prompt: `Analyze the following markdown content and extract all entities and their relationships. 
    
For each entity, provide:
- A unique ID (use descriptive lowercase names with underscores)
- A type (Person, Concept, Organization, Technology, etc.)
- Relevant properties as key-value pairs

For each relationship, provide:
- Source entity ID (from)
- Target entity ID (to)
- Relationship type (descriptive verb like WORKS_ON, RELATES_TO, CREATED_BY, etc.)
- Optional properties

Markdown content:
${content}`,
  });
  
  return result.object;
}

/**
 * Generate Cypher queries using AI
 */
async function generateCypherQueries(
  entities: Array<any>,
  relationships: Array<any>,
  cid: string
) {
  const result = await generateObject({
    model: openai('gpt-4o'),
    schemaName: 'cypherQueries',
    schemaDescription: 'Cypher queries to create knowledge graph in Memgraph',
    schema: CypherQuerySchema,
    prompt: `Generate Cypher queries to create the following knowledge graph in Memgraph/Neo4j.

IMPORTANT: 
- Include the source CID "${cid}" as a property on ALL entities
- Use MERGE instead of CREATE to avoid duplicates
- First create all nodes, then create all relationships
- Use proper Cypher syntax

Entities: ${JSON.stringify(entities, null, 2)}
Relationships: ${JSON.stringify(relationships, null, 2)}

Generate queries that:
1. Create/merge all entity nodes with the source_cid property
2. Create/merge all relationships`,
  });
  
  return result.object.queries;
}

/**
 * Execute Cypher queries in Memgraph
 */
async function executeInMemgraph(queries: Array<{ cypher: string; description: string }>) {
  const MEMGRAPH_URI = process.env.MEMGRAPH_URI!;
  const MEMGRAPH_USERNAME = process.env.MEMGRAPH_USERNAME!;
  const MEMGRAPH_PASSWORD = process.env.MEMGRAPH_PASSWORD!;
  const driver = db.driver(MEMGRAPH_URI, neo4j.auth.basic(MEMGRAPH_USERNAME, MEMGRAPH_PASSWORD), {
    disableLosslessIntegers: true
  });
  const session = driver.session();
  
  try {
    const results = [];
    
    for (const query of queries) {
      const result = await session.run(query.cypher);
      results.push({
        description: query.description,
        cypher: query.cypher,
        recordsAffected: result.records.length,
        summary: result.summary?.counters ? {
          nodesCreated: result.summary.counters.updates().nodesCreated,
          relationshipsCreated: result.summary.counters.updates().relationshipsCreated,
          propertiesSet: result.summary.counters.updates().propertiesSet,
        } : null
      });
    }
    
    return results;
  } finally {
    await session.close();
    await driver.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let fileName: string;
    let fileSize: number;
    let content: string;
    let isEncrypted = false;
    let encryptionMetadata: any = null;

    // Handle both encrypted (JSON) and non-encrypted (FormData) requests
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      
      if (!body.encryptedData) {
        return NextResponse.json({ error: 'No encrypted data provided' }, { status: 400 });
      }

      isEncrypted = true;
      const encryptedData = body.encryptedData;
      
      fileName = encryptedData.fileName;
      fileSize = encryptedData.fileSize;
      encryptionMetadata = encryptedData.encryptionMetadata;
      
      // Store the encrypted content as JSON string for upload to Filecoin
      // In a production system, you might want to decrypt here if needed,
      // but for this demo we'll store it encrypted and only decrypt on retrieval
      content = JSON.stringify(encryptedData.encryptedContent);
      
    } else {
      // Legacy FormData handling (non-encrypted)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = ['text/markdown', 'text/plain', 'text/mdx'];
      const allowedExtensions = ['.md', '.txt', '.mdx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        return NextResponse.json({ 
          error: 'Invalid file type. Only markdown (.md) and text (.txt) files are allowed.' 
        }, { status: 400 });
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ 
          error: 'File too large. Maximum size is 10MB.' 
        }, { status: 400 });
      }

      fileName = file.name;
      fileSize = file.size;
      content = await file.text();
    }

    const steps: ProcessingStep[] = isEncrypted
      ? [
          { step: 'encrypt', status: 'completed', message: `File encrypted with Lit Protocol (${encryptionMetadata?.accessType})` },
          { step: 'upload', status: 'pending', message: 'Uploading encrypted file to Filecoin storage...' },
          { step: 'parse', status: 'pending', message: 'Extracting entities and relationships...' },
          { step: 'generate_queries', status: 'pending', message: 'Generating Cypher queries...' },
          { step: 'execute_queries', status: 'pending', message: 'Executing queries in Memgraph...' },
          { step: 'complete', status: 'pending', message: 'Processing complete!' }
        ]
      : [
          { step: 'upload', status: 'pending', message: 'Uploading file to Filecoin storage...' },
          { step: 'parse', status: 'pending', message: 'Extracting entities and relationships...' },
          { step: 'generate_queries', status: 'pending', message: 'Generating Cypher queries...' },
          { step: 'execute_queries', status: 'pending', message: 'Executing queries in Memgraph...' },
          { step: 'complete', status: 'pending', message: 'Processing complete!' }
        ];

    const uploadStepIndex = isEncrypted ? 1 : 0;
    const parseStepIndex = isEncrypted ? 2 : 1;

    // Step: Upload to Synapse
    steps[uploadStepIndex].status = 'in_progress';
    const fileBuffer = Buffer.from(content, 'utf-8');
    const uploadResult = await uploadToSynapse(fileBuffer, fileName);
    steps[uploadStepIndex].status = 'completed';
    steps[uploadStepIndex].data = uploadResult;

    // Step: Parse content (only if not encrypted, or decrypt first)
    steps[parseStepIndex].status = 'in_progress';
    
    // For encrypted content, we need to note that parsing happens on decrypted content
    // In this demo, we'll parse the original content before encryption was applied
    // In production, you'd decrypt here using Lit Protocol with appropriate auth
    let knowledgeGraph;
    
    if (isEncrypted) {
      // For demo purposes, skip KG extraction on encrypted content
      // In production, decrypt with Lit Protocol then parse
      knowledgeGraph = {
        entities: [],
        relationships: []
      };
      steps[parseStepIndex].status = 'completed';
      steps[parseStepIndex].message = 'Content encrypted - KG extraction skipped (decrypt to process)';
    } else {
      knowledgeGraph = await parseMarkdownToKG(content);
      steps[parseStepIndex].status = 'completed';
    }
    steps[parseStepIndex].data = knowledgeGraph;

    const generateStepIndex = isEncrypted ? 3 : 2;
    const executeStepIndex = isEncrypted ? 4 : 3;
    const completeStepIndex = isEncrypted ? 5 : 4;

    // Step: Generate Cypher queries
    steps[generateStepIndex].status = 'in_progress';
    let cypherQueries;
    
    if (isEncrypted || (knowledgeGraph.entities.length === 0 && knowledgeGraph.relationships.length === 0)) {
      // Skip query generation for encrypted content
      cypherQueries = [];
      steps[generateStepIndex].status = 'completed';
      steps[generateStepIndex].message = isEncrypted 
        ? 'Encrypted - Cypher generation skipped' 
        : 'No entities found';
    } else {
      cypherQueries = await generateCypherQueries(
        knowledgeGraph.entities,
        knowledgeGraph.relationships,
        uploadResult.pieceCid
      );
      steps[generateStepIndex].status = 'completed';
    }
    steps[generateStepIndex].data = cypherQueries;

    // Step: Execute queries
    steps[executeStepIndex].status = 'in_progress';
    let queryResults;
    
    if (cypherQueries.length === 0) {
      queryResults = [];
      steps[executeStepIndex].status = 'completed';
      steps[executeStepIndex].message = isEncrypted 
        ? 'Encrypted - Query execution skipped' 
        : 'No queries to execute';
    } else {
      queryResults = await executeInMemgraph(cypherQueries);
      steps[executeStepIndex].status = 'completed';
    }
    steps[executeStepIndex].data = queryResults;

    // Step: Complete
    steps[completeStepIndex].status = 'completed';

    return NextResponse.json({
      success: true,
      steps,
      summary: {
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        cid: uploadResult.pieceCid,
        entitiesCount: knowledgeGraph.entities.length,
        relationshipsCount: knowledgeGraph.relationships.length,
        queriesExecuted: cypherQueries.length,
        isEncrypted,
        encryptionType: encryptionMetadata?.accessType
      }
    });

  } catch (error) {
    console.error('Upload and processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
