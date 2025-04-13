import { NextRequest, NextResponse } from 'next/server';

/**
 * Download handler that fetches files from IPFS using the CID
 */
export async function GET(request: NextRequest) {
  try {
    // Get the CID from the query parameters
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');
    
    if (!cid) {
      return NextResponse.json(
        { success: false, error: "No CID provided" },
        { status: 400 }
      );
    }
    
    console.log(`Processing download request for CID: ${cid}`);
    
    try {
      // Use the IPFS HTTP gateway to fetch the file
      const gatewayUrl = `https://w3s.link/ipfs/${cid}`;
      const response = await fetch(gatewayUrl);
      
      if (!response.ok) {
        throw new Error(`Gateway returned status: ${response.status}`);
      }
      
      // Get the content type from the response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Get the file content
      const content = await response.text();
      
      // Return the file content
      return NextResponse.json({
        success: true,
        content,
        contentType
      });
    } catch (downloadError: any) {
      console.error("File download error:", downloadError);
      throw new Error(`File download failed: ${downloadError.message || "Unknown download error"}`);
    }
  } catch (error: any) {
    console.error('Error downloading file from Storacha:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to download file from Storacha' 
      },
      { status: 500 }
    );
  }
} 