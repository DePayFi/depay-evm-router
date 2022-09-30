import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import '@typechain/hardhat'
import { sharedConfig, MNEMONIC, BSC_RPC_URL, BSC_RPC_API_KEY } from './hardhat.config.shared'

const hardhatConfig = {
  ...sharedConfig,
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC!
      },
      forking: {
        url: BSC_RPC_URL!,
        httpHeaders: {
          'x-api-key': BSC_RPC_API_KEY
        },
        enabled: true
      }
    }
  }
}

export default hardhatConfig
