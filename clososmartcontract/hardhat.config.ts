import { config as dotenvConfig } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

dotenvConfig();

function normalizePrivateKey(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

const privateKey = normalizePrivateKey(process.env.PRIVATE_KEY);
const etherscanApiKey = process.env.ETHERSCAN_API_KEY ?? "";
const chainId = Number(process.env.MONAD_CHAIN_ID ?? "10143");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "prague",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    monadTestnet: {
      url: process.env.MONAD_TESTNET_RPC_URL ?? "https://testnet-rpc.monad.xyz",
      chainId,
      accounts: privateKey ? [privateKey] : [],
    },
  },
  etherscan: {
    apiKey: {
      monadTestnet: etherscanApiKey,
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet.monadscan.com/api",
          browserURL: "https://testnet.monadscan.com",
        },
      },
    ],
  },
};

export default config;
