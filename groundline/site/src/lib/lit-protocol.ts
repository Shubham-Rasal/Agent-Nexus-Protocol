import { createLitClient } from "@lit-protocol/lit-client";
import { createAccBuilder } from "@lit-protocol/access-control-conditions";
import { nagaDev } from "@lit-protocol/networks";

/**
 * Lit Protocol encryption and decryption utilities
 */

let litClient: any;

/**
 * Initialize the Lit Protocol client
 */
export async function initLitClient(): Promise<any> {
  if (litClient) {
    return litClient;
  }

  litClient = await createLitClient({
    network: nagaDev,
  });

  await litClient.connect();
  return litClient;
}

/**
 * Get the current Lit client instance  
 */
export function getLitClient(): any {
  return litClient;
}

/**
 * Build access control conditions for a specific wallet address
 * This allows only the specified wallet to decrypt the data
 */
export function buildAccessControlConditions(walletAddress: string) {
  const builder = createAccBuilder();

  // Allow owner of the wallet to decrypt
  const accs = builder
    .requireWalletOwnership(walletAddress)
    .on("ethereum")
    .build();

  return accs;
}

/**
 * Build public access control conditions (anyone can decrypt)
 * Useful for publicly shared knowledge graphs
 */
export function buildPublicAccessConditions() {
  const builder = createAccBuilder();

  // Allow anyone with 0 or more ETH (essentially public)
  const accs = builder
    .requireEthBalance("0", ">=")
    .on("ethereum")
    .build();

  return accs;
}

/**
 * Encrypt data using Lit Protocol
 */
export async function encryptData(
  dataToEncrypt: string | Uint8Array,
  accessControlConditions: any,
  chain: string = "ethereum"
): Promise<{
  ciphertext: string;
  dataToEncryptHash: string;
}> {
  const client = await initLitClient();

  const encrypted = await client.encrypt({
    dataToEncrypt,
    unifiedAccessControlConditions: accessControlConditions,
    chain,
  });

  return encrypted;
}

/**
 * Decrypt data using Lit Protocol
 * Requires authentication context
 */
export async function decryptData(
  encryptedData: {
    ciphertext: string;
    dataToEncryptHash: string;
  },
  accessControlConditions: any,
  authContext: any,
  chain: string = "ethereum"
): Promise<string> {
  const client = await initLitClient();

  const decrypted = await client.decrypt({
    data: encryptedData,
    unifiedAccessControlConditions: accessControlConditions,
    authContext,
    chain,
  });

  // Convert decrypted data to string
  if (typeof decrypted === "string") {
    return decrypted;
  } else if (decrypted instanceof Uint8Array) {
    return new TextDecoder().decode(decrypted);
  } else {
    throw new Error("Unexpected decrypted data type");
  }
}

/**
 * Create EOA (Externally Owned Account) auth context for decryption
 * This is used when a user wants to decrypt data
 */
export async function createAuthContext(
  account: any,
  litClient: any,
  domain: string = "localhost",
  statement: string = "Decrypt encrypted file"
) {
  // Note: This requires the account to have signing capability
  // In a real app, this would use the user's wallet (e.g., MetaMask)
  
  const authContext = await litClient.createEoaAuthContext({
    config: {
      account,
    },
    authConfig: {
      domain,
      statement,
      expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
      resources: [
        ["access-control-condition-decryption", "*"],
        ["lit-action-execution", "*"],
      ],
    },
  });

  return authContext;
}

/**
 * Encrypt file content for upload
 */
export interface EncryptedFileData {
  fileName: string;
  fileSize: number;
  encryptedContent: {
    ciphertext: string;
    dataToEncryptHash: string;
  };
  accessControlConditions: any;
  encryptionMetadata: {
    chain: string;
    encryptedAt: string;
    accessType: "public" | "private";
    authorizedWallet?: string;
  };
}

export async function encryptFile(
  fileContent: string,
  fileName: string,
  fileSize: number,
  options: {
    accessType: "public" | "private";
    authorizedWallet?: string;
  }
): Promise<EncryptedFileData> {
  // Build appropriate access control conditions
  const accessControlConditions = options.accessType === "public"
    ? buildPublicAccessConditions()
    : buildAccessControlConditions(options.authorizedWallet!);

  // Encrypt the file content
  const encryptedContent = await encryptData(
    fileContent,
    accessControlConditions,
    "ethereum"
  );

  return {
    fileName,
    fileSize,
    encryptedContent,
    accessControlConditions,
    encryptionMetadata: {
      chain: "ethereum",
      encryptedAt: new Date().toISOString(),
      accessType: options.accessType,
      authorizedWallet: options.authorizedWallet,
    },
  };
}

/**
 * Decrypt file content
 */
export async function decryptFile(
  encryptedFileData: EncryptedFileData,
  authContext: any
): Promise<string> {
  return await decryptData(
    encryptedFileData.encryptedContent,
    encryptedFileData.accessControlConditions,
    authContext,
    encryptedFileData.encryptionMetadata.chain
  );
}

