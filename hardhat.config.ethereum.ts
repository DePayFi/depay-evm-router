import { HardhatUserConfig } from 'hardhat/types'
import { config, MNEMONIC, ETHEREUM_RPC_URL } from './hardhat.config.shared'

const hardhatConfig: HardhatUserConfig = {
  ...config,
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      blockGasLimit: 12500000,
      gas: 6500000,
      gasPrice: 2000000000,
      accounts: {
        mnemonic: MNEMONIC!
      },
      forking: {
        url: ETHEREUM_RPC_URL!,
        enabled: true
      }
    }
  }
}

export default hardhatConfig
