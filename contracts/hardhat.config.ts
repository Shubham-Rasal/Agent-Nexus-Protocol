import "@nomicfoundation/hardhat-ethers";
import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.24",
        settings: {
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    },
  },
  networks: {
    hardhatLocal: {
      type: "edr-simulated",
      chainType: "l1",
    },
    filecoinCalibration: {
      type: "http",
      chainType: "l1",
      url: process.env.FILECOIN_CALIBRATION_RPC_URL || "https://api.calibration.node.glif.io/rpc/v1",
      accounts: process.env.FILECOIN_CALIBRATION_PRIVATE_KEY
        ? [process.env.FILECOIN_CALIBRATION_PRIVATE_KEY]
        : [],
    },
  },
};

export default config;
