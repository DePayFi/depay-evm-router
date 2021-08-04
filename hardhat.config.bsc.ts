import { config, MNEMONIC, BSC_RPC_URL } from './hardhat.config.shared'

config.networks = {
  hardhat: {
    blockGasLimit: 12500000,
    gas: 6500000,
    gasPrice: 2000000000,
    accounts: {
      mnemonic: MNEMONIC!
    },
    forking: {
      url: BSC_RPC_URL!,
      blockNumber: 9700000,
      enabled: true
    }
  }
}

export default config
