import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'dotenv/config'

const DEPLOYER_PK = process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'cancun',  // Required for OZ v5 (mcopy opcode)
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: [DEPLOYER_PK],
      chainId: 11155111,
    },
    mainnet: {
      url: process.env.ETH_MAINNET_RPC_URL || '',
      accounts: [DEPLOYER_PK],
      chainId: 1,
    },
    base: {
      url: process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org',
      accounts: [DEPLOYER_PK],
      chainId: 8453,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      base: process.env.BASESCAN_API_KEY || '',
    },
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
  },
}

export default config
