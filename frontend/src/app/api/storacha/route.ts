import { NextRequest, NextResponse } from 'next/server';

// This is now a legacy route - redirecting to the new delegation endpoint
export async function POST(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/storacha/delegation', request.url));
}

// GET handler - informs about the API restructuring
export async function GET() {
  return NextResponse.json(
    { 
      status: "Storacha API has been restructured", 
      endpoints: {
        delegation: "/api/storacha/delegation",
        upload: "/api/storacha/upload"
      }
    },
    { status: 200 }
  );
} 