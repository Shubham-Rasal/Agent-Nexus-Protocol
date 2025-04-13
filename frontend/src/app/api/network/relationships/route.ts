import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Define path to relationships.json file
    const relationshipsPath = path.join(process.cwd(), 'src/app/relationships.json');
    
    // Read the JSON file
    const relationshipsData = await fs.readFile(relationshipsPath, 'utf-8');
    
    // Parse and return the data
    return NextResponse.json(JSON.parse(relationshipsData), { status: 200 });
  } catch (error) {
    console.error('Error fetching relationships data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relationships data' },
      { status: 500 }
    );
  }
} 