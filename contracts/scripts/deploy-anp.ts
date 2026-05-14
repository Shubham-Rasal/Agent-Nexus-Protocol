import hre from "hardhat";
import { encodeAbiParameters, encodeFunctionData, Hex } from "viem";
import dotenv from "dotenv";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Deploy ANP ERC-8004 contracts to Filecoin Calibration.
 *
 * Steps:
 *  1. Deploy MinimalUUPSSimple (placeholder impl)
 *  2. Deploy IdentityRegistry proxy  → MinimalUUPSSimple
 *  3. Deploy ReputationRegistry proxy → MinimalUUPSSimple
 *  4. Deploy IdentityRegistryUpgradeable impl
 *  5. Deploy ReputationRegistryUpgradeable impl
 *  6. Upgrade IdentityRegistry proxy  → real impl
 *  7. Upgrade ReputationRegistry proxy → real impl
 *  8. Write addresses to deployments/calibration.json
 */
async function main() {
  const { viem } = await hre.network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  const chainId = await publicClient.getChainId();

  console.log("Deploying ANP ERC-8004 Contracts");
  console.log("=================================");
  console.log("Deployer:", deployer.account.address);
  console.log("Network: ", hre.network.name, `(chainId: ${chainId})`);
  console.log("");

  const minimalArtifact = await hre.artifacts.readArtifact("MinimalUUPSSimple");
  const identityImplArtifact = await hre.artifacts.readArtifact("IdentityRegistryUpgradeable");
  const reputationImplArtifact = await hre.artifacts.readArtifact("ReputationRegistryUpgradeable");
  const proxyArtifact = await hre.artifacts.readArtifact("ERC1967Proxy");

  function proxyDeployData(implementationAddress: `0x${string}`, initData: Hex): Hex {
    const args = encodeAbiParameters(
      [{ type: "address" }, { type: "bytes" }],
      [implementationAddress, initData]
    );
    return (proxyArtifact.bytecode + args.slice(2)) as Hex;
  }

  // ── Step 1: MinimalUUPSSimple ────────────────────────────────────────────
  console.log("1. Deploying MinimalUUPSSimple...");
  const minimalTxHash = await deployer.sendTransaction({
    data: minimalArtifact.bytecode as Hex,
  });
  const minimalReceipt = await publicClient.waitForTransactionReceipt({ hash: minimalTxHash });
  const minimalAddress = minimalReceipt.contractAddress!;
  console.log("   ✅", minimalAddress);

  // ── Step 2: IdentityRegistry proxy ──────────────────────────────────────
  console.log("2. Deploying IdentityRegistry proxy...");
  const identityInitData = encodeFunctionData({
    abi: minimalArtifact.abi,
    functionName: "initialize",
    args: ["0x0000000000000000000000000000000000000000"],
  });
  const identityProxyTxHash = await deployer.sendTransaction({
    data: proxyDeployData(minimalAddress, identityInitData),
  });
  const identityProxyReceipt = await publicClient.waitForTransactionReceipt({ hash: identityProxyTxHash });
  const identityProxyAddress = identityProxyReceipt.contractAddress!;
  console.log("   ✅", identityProxyAddress);

  // ── Step 3: ReputationRegistry proxy ────────────────────────────────────
  console.log("3. Deploying ReputationRegistry proxy...");
  const reputationInitData = encodeFunctionData({
    abi: minimalArtifact.abi,
    functionName: "initialize",
    args: [identityProxyAddress],
  });
  const reputationProxyTxHash = await deployer.sendTransaction({
    data: proxyDeployData(minimalAddress, reputationInitData),
  });
  const reputationProxyReceipt = await publicClient.waitForTransactionReceipt({ hash: reputationProxyTxHash });
  const reputationProxyAddress = reputationProxyReceipt.contractAddress!;
  console.log("   ✅", reputationProxyAddress);

  // ── Step 4: IdentityRegistryUpgradeable impl ─────────────────────────────
  console.log("4. Deploying IdentityRegistryUpgradeable impl...");
  const identityImplTxHash = await deployer.sendTransaction({
    data: identityImplArtifact.bytecode as Hex,
  });
  const identityImplReceipt = await publicClient.waitForTransactionReceipt({ hash: identityImplTxHash });
  const identityImplAddress = identityImplReceipt.contractAddress!;
  console.log("   ✅", identityImplAddress);

  // ── Step 5: ReputationRegistryUpgradeable impl ───────────────────────────
  console.log("5. Deploying ReputationRegistryUpgradeable impl...");
  const reputationImplTxHash = await deployer.sendTransaction({
    data: reputationImplArtifact.bytecode as Hex,
  });
  const reputationImplReceipt = await publicClient.waitForTransactionReceipt({ hash: reputationImplTxHash });
  const reputationImplAddress = reputationImplReceipt.contractAddress!;
  console.log("   ✅", reputationImplAddress);

  // ── Step 6: Upgrade IdentityRegistry proxy ───────────────────────────────
  console.log("6. Upgrading IdentityRegistry proxy → IdentityRegistryUpgradeable...");
  const identityUpgradeData = encodeFunctionData({
    abi: minimalArtifact.abi,
    functionName: "upgradeToAndCall",
    args: [
      identityImplAddress,
      encodeFunctionData({ abi: identityImplArtifact.abi, functionName: "initialize", args: [] }),
    ],
  });
  const identityUpgradeTx = await deployer.sendTransaction({
    to: identityProxyAddress,
    data: identityUpgradeData,
  });
  await publicClient.waitForTransactionReceipt({ hash: identityUpgradeTx });
  console.log("   ✅ tx:", identityUpgradeTx);

  // ── Step 7: Upgrade ReputationRegistry proxy ─────────────────────────────
  console.log("7. Upgrading ReputationRegistry proxy → ReputationRegistryUpgradeable...");
  const reputationUpgradeData = encodeFunctionData({
    abi: minimalArtifact.abi,
    functionName: "upgradeToAndCall",
    args: [
      reputationImplAddress,
      encodeFunctionData({
        abi: reputationImplArtifact.abi,
        functionName: "initialize",
        args: [identityProxyAddress],
      }),
    ],
  });
  const reputationUpgradeTx = await deployer.sendTransaction({
    to: reputationProxyAddress,
    data: reputationUpgradeData,
  });
  await publicClient.waitForTransactionReceipt({ hash: reputationUpgradeTx });
  console.log("   ✅ tx:", reputationUpgradeTx);

  // ── Step 8: Save deployment addresses ────────────────────────────────────
  const deployment = {
    network: hre.network.name,
    chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.account.address,
    contracts: {
      IdentityRegistry: identityProxyAddress,
      ReputationRegistry: reputationProxyAddress,
      IdentityRegistryImpl: identityImplAddress,
      ReputationRegistryImpl: reputationImplAddress,
    },
  };

  const deploymentsDir = join(__dirname, "..", "deployments");
  mkdirSync(deploymentsDir, { recursive: true });
  const outPath = join(deploymentsDir, "calibration.json");
  writeFileSync(outPath, JSON.stringify(deployment, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("Network:            ", hre.network.name, `(${chainId})`);
  console.log("IdentityRegistry:   ", identityProxyAddress);
  console.log("ReputationRegistry: ", reputationProxyAddress);
  console.log("Owner:              ", deployer.account.address);
  console.log("Saved to:           ", outPath);
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
