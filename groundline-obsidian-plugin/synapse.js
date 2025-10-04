
import { RPC_URLS, Synapse } from "@filoz/synapse-sdk";
import { ethers } from "ethers";
import * as fs from "fs/promises";

async function main() {
  // Get file path from command line arguments
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("❌ No file path provided");
    process.exit(1);
  }

  console.log("🚀 Starting Synapse SDK backup...");

  try {
    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY,
      new ethers.JsonRpcProvider(process.env.RPC_URL)
    );

    const synapse = await Synapse.create({
      signer: wallet,
      withCDN: true,
    });

    console.log("✅ Synapse instance created");
    console.log("   Signer:", await synapse.getSigner().getAddress());

    // Warm storage context
    const context = await synapse.storage.createContext({
      dataSetId: 24,
      withCDN: true,
    });

    console.log("✅ Context created:", context.dataSetMetadata);

    // Upload file
    const fileBuffer = await fs.readFile(filePath);
    const fileName = filePath.split('/').pop();

    console.log(`⬆️ Uploading ${fileName} (${fileBuffer.length} bytes)...`);
    const result = await context.upload(fileBuffer, {
      onUploadComplete: (cid) => console.log("✅ Upload complete:", cid),
      onPieceAdded: (p) => console.log("🧩 Piece added:", p),
      onPieceConfirmed: (p) => console.log("✅ Piece confirmed:", p),
    });

    console.log("🎉 Upload successful:", result);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

main();
