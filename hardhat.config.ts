import { HardhatUserConfig } from 'hardhat/types'
import { config } from './hardhat.config.shared'

const hardhatConfig: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    version: '0.8.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      blockGasLimit: 12500000,
      gas: 6500000,
      gasPrice: 2000000000,
      hardfork: 'london'
    }
  }
}

export default hardhatConfig
