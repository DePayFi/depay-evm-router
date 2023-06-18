import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import { sharedConfig, MNEMONIC, ARBITRUM_ONE_RPC_URL } from './hardhat.config.shared'

const hardhatConfig = {
  ...sharedConfig,
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC!
      },
      forking: {
        url: ARBITRUM_ONE_RPC_URL!,
        enabled: true
      }
    }
  }
}

export default hardhatConfig
