import { NextRequest, NextResponse } from 'next/server';
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Proof from "@web3-storage/w3up-client/proof";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";
import * as DID from "@ipld/dag-ucan/did";

// Cache the client instance between requests
let clientPromise: Promise<any> | null = null;

// Initialize the client - this function will be called only once
async function initializeClient() {
  try {
    // Get credentials from environment variables
    const privateKey = process.env.STORACHA_PRIVATE_KEY;
    const proof = process.env.STORACHA_PROOF;

    // Validate the environment variables
    if (!privateKey || !proof) {
      throw new Error("Missing STORACHA_PRIVATE_KEY or STORACHA_PROOF environment variables");
    }

    console.log("Using private key length:", privateKey.length);
    
    // Check for valid key format - should be base64 encoded and have appropriate length
    if (!privateKey.endsWith('=') || privateKey.length < 50) {
      throw new Error("Private key appears to be incorrectly formatted");
    }
    
    try {
      // Create client with the saved credentials
      const principal = Signer.parse("MgCanMIYIDocQ7UHiNRItNESJ09XMftb27p190zbE/vDaJe0BD/CePC0NXUu6AOoYuHKzDBqZ9sHPvmrKBCKfmbjYhVc=");
      const store = new StoreMemory();
      const client = await create({ principal, store });
      
      // Add proof that this agent has been delegated capabilities on the space
      const parsedProof = await Proof.parse(proof);
      const space = await client.addSpace(parsedProof);
      await client.setCurrentSpace(space.did());
      console.log("Storacha client initialized successfully");
      
      return client;
    } catch (parseError) {
      console.error("Failed to parse credentials:", parseError);
      
      // Fallback to standard client creation if credentials parsing fails
      console.log("Falling back to standard client initialization...");
      const client = await create();
      
      // This will prompt for email login but at least won't crash
      return client;
    }
  } catch (error) {
    console.error("Failed to initialize Storacha client:", error);
    throw error;
  }
}

// Get or initialize the client
async function getClient() {
  if (!clientPromise) {
    clientPromise = initializeClient();
  }
  return clientPromise;
}

// POST handler - creates a delegation for the provided DID
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { did } = body;
    
    if (!did) {
      return NextResponse.json(
        { error: "DID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Creating Storacha delegation for DID: ${did}`);
    
    // Get the client
    const client = await getClient();
    
    // Parse the DID
    const audience = DID.parse(did);
    
    // Define capabilities to delegate
    const abilities = ["space/blob/add", "space/index/add", "filecoin/offer", "upload/add"];
    
    // Set expiration for 24 hours from now
    const expiration = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
    
    // Create the delegation
    const delegation = await client.createDelegation(audience, abilities, { expiration });
    
    // Serialize the delegation
    const archive = await delegation.archive();
    
    if (!archive.ok) {
      throw new Error("Failed to archive delegation");
    }
    
    // Convert to Base64 for easy transfer
    const base64Delegation = Buffer.from(archive.ok).toString("base64");
    
    return NextResponse.json({ delegation: base64Delegation });
  } catch (error: any) {
    console.error("Error creating Storacha delegation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create delegation" },
      { status: 500 }
    );
  }
}

