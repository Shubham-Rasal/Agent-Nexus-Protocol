import { NextRequest, NextResponse } from 'next/server';
import { create } from "@web3-storage/w3up-client";
import * as Delegation from "@web3-storage/w3up-client/delegation";

// Upload handler that receives files and handles delegation internally
export async function POST(request: NextRequest) {
  try {
    // Create a new client for the upload
    const client = await create();
    const clientDid = client.agent.did();
    
    // Get the form data with files
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }
    
    console.log(`Processing upload request with ${files.length} files`);
    
    // Request delegation from our delegation endpoint
    const delegationResponse = await fetch(new URL('/api/storacha/delegation', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ did: clientDid }),
    });
    
    if (!delegationResponse.ok) {
      const errorData = await delegationResponse.json();
      throw new Error(`Failed to get delegation: ${errorData.error || delegationResponse.statusText}`);
    }
    
    const { delegation: base64Delegation } = await delegationResponse.json();
    console.log('Received delegation from API');
    
    // Convert base64 delegation to bytes
    const delegationBytes = Buffer.from(base64Delegation, 'base64');
    
    // Extract the delegation
    const extractResult = await Delegation.extract(delegationBytes);
    if (!extractResult.ok) {
      throw new Error('Failed to extract delegation');
    }
    
    // Add the space using the delegation
    const space = await client.addSpace(extractResult.ok);
    await client.setCurrentSpace(space.did());
    
    console.log('Space added and set as current for upload');
    
    // Upload the files
    console.log(`Uploading ${files.length} files to Storacha...`);
    
    // Convert the files to the format expected by uploadDirectory
    const uploadFiles = files.map(file => 
      new File([file], file.name, { type: file.type })
    );
    
    // Upload the files
    const cid = await client.uploadDirectory(uploadFiles);
    
    // Return the upload result
    const result = {
      success: true,
      cid: cid.toString(),
      url: `https://w3s.link/ipfs/${cid}`,
      files: files.map(f => f.name)
    };
    
    console.log('Upload successful:', result);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error uploading files to Storacha:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to upload files to Storacha' 
      },
      { status: 500 }
    );
  }
}
