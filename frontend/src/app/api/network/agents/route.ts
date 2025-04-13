import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Define path to agents.json file
    const agentsPath = path.join(process.cwd(), 'src/app/agents.json');
    
    // Read the JSON file
    const agentsData = await fs.readFile(agentsPath, 'utf-8');
    
    // Parse and return the data
    return NextResponse.json(JSON.parse(agentsData), { status: 200 });
  } catch (error) {
    console.error('Error fetching agents data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents data' },
      { status: 500 }
    );
  }
} 