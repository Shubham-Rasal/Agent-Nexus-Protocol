# Lit Protocol Encryption Setup

This guide explains the new Lit Protocol encryption implementation and how to test it.

## Overview

The encryption logic has been reimplemented using the latest Lit Protocol SDK with the following features:

- File encryption/decryption using Lit Protocol
- Contract-based access control conditions
- SIWE (Sign-In with Ethereum) authentication
- Support for Filecoin Calibration Testnet

## Required Dependencies

You need to install the following packages:

```bash
npm install @lit-protocol/lit-node-client @lit-protocol/encryption
```

Or if you're using yarn:

```bash
yarn add @lit-protocol/lit-node-client @lit-protocol/encryption
```

## Files Created/Modified

### New Files

1. **`src/utils/contracts.ts`** - Contract address configuration
2. **`src/lib/litClient.ts`** - Main Lit Protocol encryption logic
3. **`src/app/app/lit-test/page.tsx`** - Test page for encryption/decryption
4. **`src/components/ui/badge.tsx`** - Badge UI component
5. **`src/components/ui/alert.tsx`** - Alert UI component

### Configuration

**Important:** Update the `CONTRACT_ADDRESS` in `src/utils/contracts.ts` with your actual deployed contract address. The current placeholder is:

```typescript
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
```

## Contract Requirements

The access control logic expects a smart contract with the following interface:

```solidity
function canRead(uint256 tokenId, address user) external view returns (bool)
```

This function should return `true` if the user has permission to decrypt the content.

## Testing the Implementation

### Access the Test Page

Navigate to `/app/lit-test` in your application to access the test interface.

### Test Flow

1. **Connect Wallet** - Make sure your wallet is connected via WalletConnect/ConnectKit
2. **Select File** - Choose a file to encrypt (supports images, text files, etc.)
3. **Encrypt** - Click "Encrypt File" to encrypt using Lit Protocol
4. **Decrypt** - Click "Decrypt File" to decrypt and verify the content
5. **Download** - Download the decrypted file to verify it matches the original

### Features of the Test Page

- **Visual Previews** - See preview of files before encryption and after decryption
- **Progress Tracking** - Real-time progress indicators for encryption/decryption
- **Connection Status** - Monitor wallet and Lit Network connection status
- **Error Handling** - Clear error messages for debugging
- **File Metadata** - View detailed information about encrypted files

## API Reference

### `initLitClient()`

Initializes the Lit Protocol client.

```typescript
const client = await initLitClient();
```

### `encryptFileWithLit(file, walletAddress)`

Encrypts a file using Lit Protocol.

```typescript
const encrypted = await encryptFileWithLit(file, address);
// Returns: { ciphertext, dataToEncryptHash, originalFileName, ... }
```

### `decryptFileWithLit(ciphertext, dataToEncryptHash, metadata, walletAddress)`

Decrypts a file using Lit Protocol.

```typescript
const decrypted = await decryptFileWithLit(
  ciphertext,
  dataToEncryptHash,
  { originalFileName, originalFileSize, originalFileType },
  address
);
// Returns: File object
```

### `getAuthSig()`

Gets authentication signature for decryption.

```typescript
const authSig = await getAuthSig();
// Returns: { sig, derivedVia, signedMessage, address }
```

## Network Configuration

The implementation uses:

- **Lit Network**: `datil-dev` (development network)
- **Blockchain**: Filecoin Calibration Testnet (Chain ID: 314159)

For production, update these values in `src/lib/litClient.ts`.

## Troubleshooting

### "No Ethereum provider found"

Make sure MetaMask or another Web3 wallet is installed and connected.

### "Failed to connect to Lit Protocol"

Check your internet connection and ensure the Lit Protocol network is accessible.

### Contract Access Denied

Verify that:
1. The `CONTRACT_ADDRESS` is correct
2. Your wallet address has the required permissions in the smart contract
3. The contract is deployed on Filecoin Calibration Testnet

### TypeScript Errors

If you see import errors for `@lit-protocol/lit-node-client` or `@lit-protocol/encryption`, make sure you've installed the required dependencies.

## Next Steps

1. Install the required dependencies
2. Update the `CONTRACT_ADDRESS` in `src/utils/contracts.ts`
3. Deploy or connect to a contract with the `canRead` function
4. Test the encryption/decryption flow at `/app/lit-test`
5. Integrate the encryption logic into your main application

## Security Notes

- The SIWE message includes a 24-hour expiration
- Random nonces are generated for each signature
- Access control is enforced via smart contract conditions
- All encryption happens client-side before data leaves the browser





