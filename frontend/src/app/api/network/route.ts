import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// API route to update agents and relationships JSON files
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agents, relationships } = body;

    if (!agents && !relationships) {
      return NextResponse.json(
        { error: 'Missing agents or relationships data' },
        { status: 400 }
      );
    }

    // Define paths to JSON files
    const agentsPath = path.join(process.cwd(), 'src/app/agents.json');
    const relationshipsPath = path.join(process.cwd(), 'src/app/relationships.json');

    // Update agents.json if agents data is provided
    if (agents) {
      await fs.writeFile(
        agentsPath,
        JSON.stringify({ agents }, null, 2),
        'utf-8'
      );
    }

    // Update relationships.json if relationships data is provided
    if (relationships) {
      await fs.writeFile(
        relationshipsPath,
        JSON.stringify({ relationships }, null, 2),
        'utf-8'
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating network data:', error);
    return NextResponse.json(
      { error: 'Failed to update network data' },
      { status: 500 }
    );
  }
} 