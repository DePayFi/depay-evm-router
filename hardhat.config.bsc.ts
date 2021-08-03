import '@nomiclabs/hardhat-waffle'
import 'hardhat-typechain'
import 'solidity-coverage'
import { HardhatUserConfig } from 'hardhat/types'

import dotenv from 'dotenv'
dotenv.config()

var { DEPAY_MNEMONIC, DEPAY_RPC_URL } = process.env

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      blockGasLimit: 12500000,
      gas: 6500000,
      gasPrice: 2000000000,
      accounts: {
        mnemonic: (DEPAY_MNEMONIC || '').trim(),
        path: "m/44'/60'/0'/0"
      },
      forking: {
        url: 'https://bsc-dataseed.binance.org',
        enabled: true
      }
    }
  },
  solidity: {
    version: '0.7.5',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}

export default config
