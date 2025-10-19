import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker container monitoring
 * Returns 200 OK if the service is running properly
 */
export async function GET() {
  try {
    // Basic health check - service is responding
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'groundline-site',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

