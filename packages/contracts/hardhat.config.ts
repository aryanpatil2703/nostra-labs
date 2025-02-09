import "dotenv/config";
import { vars } from "hardhat/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    baseMainnet: {
      url: vars.get("BASE_RPC_URL") ?? "https://base.llamarpc.com",
      chainId: 8453,
      accounts: [vars.get("DEPLOYER_PRIVATE_KEY")],
    },
    baseSepolia: {
      url:
        vars.get("BASE_SEPOLIA_RPC_URL") ??
        "https://base-sepolia-rpc.publicnode.com",
      chainId: 84532,
      accounts: [vars.get("DEPLOYER_PRIVATE_KEY")],
    },
    arbitrumMainnet: {
      url: vars.get("ARB_RPC_URL") ?? "https://arbitrum.llamarpc.com",
      chainId: 42161,
      accounts: [vars.get("DEPLOYER_PRIVATE_KEY")],
    },
    arbitrumSepolia: {
      url:
        vars.get("ARB_SEPOLIA_RPC_URL") ??
        "https://arbitrum-sepolia-rpc.publicnode.com",
      chainId: 421614,
      accounts: [vars.get("DEPLOYER_PRIVATE_KEY")],
    },
  },
  etherscan: {
    apiKey: {
      baseMainnet: vars.get("BASE_SCAN_API_KEY"),
      baseSepolia: vars.get("BASE_SCAN_API_KEY"),
      arbitrumMainnet: vars.get("ARB_SCAN_API_KEY"),
      arbitrumSepolia: vars.get("ARB_SCAN_API_KEY"),
    },
    customChains: [
      {
        network: "baseMainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
      {
        network: "arbitrumMainnet",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/",
        },
      },
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
    ],
  },
};

export default config;
