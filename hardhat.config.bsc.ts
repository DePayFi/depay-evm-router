import { config, MNEMONIC, ETHEREUM_RPC_URL } from './hardhat.config.shared'

config.networks = {
  hardhat: {
    blockGasLimit: 12500000,
    gas: 6500000,
    gasPrice: 2000000000,
    accounts: {
      mnemonic: MNEMONIC!
    },
    forking: {
      url: 'https://bsc-dataseed.binance.org',
      enabled: true
    }
  }
}

export default config
