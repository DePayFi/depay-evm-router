import { sharedConfig } from './hardhat.config.shared'

const hardhatConfig = {
  ...sharedConfig,
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      blockGasLimit: 12500000,
      gas: 6500000,
      gasPrice: 2000000000,
    }
  }
}

export default hardhatConfig
