import { HardhatUserConfig } from 'hardhat/types'
import '@nomiclabs/hardhat-vyper'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-typechain'
import './tasks/curve-fi-test'
import './tasks/sushi-test'

import dotenv from 'dotenv'
dotenv.config()

var { DEPAY_MNEMONIC, DEPAY_ROPSTEN_URL } = process.env

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    ropsten: {
      blockGasLimit: 8000000,
      url: (DEPAY_ROPSTEN_URL || '').trim(),
      accounts: {
        mnemonic: (DEPAY_MNEMONIC || '').trim(),
        path: "m/44'/60'/0'/0"
      },
      chainId: 3
    },
    //Do forking to test deployment, just like dry-run in truffle
    hardhat: {
      blockGasLimit: 8000000,
      accounts: {
        mnemonic: (DEPAY_MNEMONIC || '').trim(),
        path: "m/44'/60'/0'/0"
      },
      forking: {
        url: (DEPAY_ROPSTEN_URL || '').trim(),
        enabled: true
      }
    }
  },
  solidity: {
    compilers: [
      { version: '0.7.5', settings: {} }, // for DePay
      { version: '0.5.16', settings: {} }, // for Uniswap
      { version: '0.6.0', settings: {} }, // for StakingPool
      { version: '0.6.2', settings: {} }, // for StakingPool
      { version: '0.6.6', settings: {} }, // for Uniswap
      { version: '0.6.12', settings: {} }, // for StakingPool
      { version: '0.4.18', settings: {} } // for WETH
    ]
  },
  vyper: {
    version: '0.2.8'
  }
}

export default config
