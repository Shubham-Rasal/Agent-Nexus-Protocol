# Storacha Delegation API

This is a Next.js API route that provides Storacha delegations directly from your Next.js application, without needing a separate backend server.

## Setup

### 1. Environment Variables

You need to set up the following environment variables in your Next.js project:

```
STORACHA_PRIVATE_KEY=your_agent_private_key
STORACHA_PROOF=your_proof_string
```

These can be added to a `.env.local` file in your project root or configured in your deployment platform.

To get these values:

1. Use the w3cli to create an agent key:
   ```bash
   w3 key create
   ```
   Store the private key (starts with "Mg...") as `STORACHA_PRIVATE_KEY`.

2. Create a delegation from your space to this agent:
   ```bash
   # First make sure you're using the right space
   w3 space use did:key:your_space_did
   
   # Create the delegation to your new agent
   w3 delegation create did:key:your_agent_did --base64
   ```
   Store the base64 output as `STORACHA_PROOF`.

### 2. API Usage

#### From Client-Side JavaScript/TypeScript

```typescript
// Example of requesting a delegation for a client
async function requestDelegation(clientDid: string) {
  const response = await fetch('/api/storacha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ did: clientDid }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get delegation');
  }
  
  const { delegation } = await response.json();
  return delegation; // base64 encoded delegation
}
```

#### Using the Delegation in a Client

```typescript
import { create } from "@web3-storage/w3up-client";
import * as Delegation from "@web3-storage/w3up-client/delegation";

async function uploadWithDelegation(base64Delegation: string, files: File[]) {
  // Create a new client
  const client = await create();
  
  // Convert base64 delegation to bytes
  const delegationBytes = Buffer.from(base64Delegation, "base64");
  
  // Extract the delegation
  const extractResult = await Delegation.extract(delegationBytes);
  if (!extractResult.ok) {
    throw new Error("Failed to extract delegation");
  }
  
  // Add the space using the delegation
  const space = await client.addSpace(extractResult.ok);
  await client.setCurrentSpace(space.did());
  
  // Upload files
  const cid = await client.uploadDirectory(files);
  
  return {
    cid: cid.toString(),
    url: `https://w3s.link/ipfs/${cid}`
  };
}
```

## API Endpoints

### POST /api/storacha

Creates a delegation for the provided DID.

**Request Body:**
```json
{
  "did": "did:key:your_client_did"
}
```

**Response:**
```json
{
  "delegation": "base64_encoded_delegation"
}
```

### GET /api/storacha

Used to check if the API is running.

**Response:**
```json
{
  "status": "Storacha delegation API is running"
}
```

## Security Considerations

- The delegations created by this API are time-limited (24 hours by default)
- In a production environment, you should add authentication to prevent unauthorized delegation requests
- Keep your `STORACHA_PRIVATE_KEY` and `STORACHA_PROOF` secure
- Consider implementing rate limiting to prevent abuse

## Customization

You can modify:
- The expiration time of delegations (default: 24 hours)
- The capabilities granted to clients
- Add authentication middleware to protect the API 