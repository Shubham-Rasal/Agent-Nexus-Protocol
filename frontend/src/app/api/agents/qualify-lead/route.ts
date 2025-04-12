import { NextResponse } from 'next/server';
import { leadQualifierTool } from '@/tools/lead-qualifier';

export async function POST(request: Request) {
  try {
    const { leadInfo } = await request.json();

    if (!leadInfo) {
      return NextResponse.json(
        { success: false, error: 'Lead information is required.' },
        { status: 400 }
      );
    }

    // Run the lead qualification tool on the server
    const result = await leadQualifierTool({ leadInfo });

    // Return the result to the client
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error qualifying lead:', error);
    
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
} 