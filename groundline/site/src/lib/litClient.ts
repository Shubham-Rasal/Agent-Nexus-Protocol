import { disconnectWeb3, LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptFile, decryptToFile } from "@lit-protocol/encryption";
import { ethers } from "ethers";

let litNodeClient: LitNodeClient | null = null;

const evmContractConditions = [
  {
    contractAddress: '0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0',
    chain: 'filecoinCalibrationTestnet',
    functionName: 'balanceOf',
    functionParams: [
      ':userAddress'
    ],
    functionAbi: {
      type: "function",
      stateMutability: "view",
      outputs: [
        { type: "uint256", name: "", internalType: "uint256" }
      ],
      name: "balanceOf",
      inputs: [
        { type: "address", name: "account", internalType: "address" }
      ]
    },
    returnValueTest: {
      key: "",
      comparator: '>',
      value: '0'
    }
  }
];

function getAccessControlConditions() {
  return evmContractConditions;
}


// Initialize Lit client
export async function initLitClient(): Promise<LitNodeClient> {
  disconnectWeb3();
  if (litNodeClient && litNodeClient.ready) {
    return litNodeClient;
  }

  litNodeClient = new LitNodeClient({
    litNetwork: "datil-dev",
  });

  await litNodeClient.connect();
  return litNodeClient;
}

// Get Lit client instance
export function getLitClient(): LitNodeClient | null {
  return litNodeClient;
}

// Encrypt file function
export async function encryptFileWithLit(
  file: File,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  walletAddress: string
): Promise<{
  ciphertext: string;
  dataToEncryptHash: string;
  originalFileName: string;
  originalFileSize: number;
  originalFileType: string;
  encryptedAt: number;
}> {
  await initLitClient();

  // Get access control conditions
  const accessControlConditionsList = getAccessControlConditions();

  // Encrypt the file
  const result = await encryptFile(
    {
      file,
      chain: "filecoinCalibrationTestnet",
      evmContractConditions: accessControlConditionsList,
    },
    litNodeClient!
  );

  return {
    ciphertext: result.ciphertext,
    dataToEncryptHash: result.dataToEncryptHash,
    originalFileName: file.name,
    originalFileSize: file.size,
    originalFileType: file.type,
    encryptedAt: Date.now(),
  };
}

// Get auth signature with proper SIWE format
export async function getAuthSig() {
  if (!window.ethereum) {
    throw new Error("No Ethereum provider found");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  // Create a proper SIWE (Sign-In with Ethereum) message
  const domain = window.location.host;
  const origin = window.location.origin;
  const statement = "Sign in with Ethereum to the app.";
  
  // Generate current timestamp and expiration (24 hours from now)
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

  // SIWE message format
  const siweMessage = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: 314159
Nonce: ${Math.random().toString(36).substring(2, 15)}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;

  const signature = await signer.signMessage(siweMessage);

  return {
    sig: signature,
    derivedVia: "web3.eth.personal.sign",
    signedMessage: siweMessage,
    address: address,
  };
}

// Decrypt file function
export async function decryptFileWithLit(
  ciphertext: string,
  dataToEncryptHash: string,
  metadata: {
    originalFileName: string;
    originalFileSize: number;
    originalFileType: string;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  walletAddress: string
): Promise<File> {
  await initLitClient();

  // Get auth signature
  const authSig = await getAuthSig();

  // Simple access control
  const accessControlConditions = getAccessControlConditions();

  // Decrypt the file
  const decryptedFile = await decryptToFile(
    {
      ciphertext,
      dataToEncryptHash,
      evmContractConditions: accessControlConditions,
      authSig,
      chain: "filecoinCalibrationTestnet",
    },
    litNodeClient!
  );

  // Return as File object with original name
  const blob = new Blob([new Uint8Array(decryptedFile)]);
  return new File([blob], metadata.originalFileName, {
    type: metadata.originalFileType,
  });
}





