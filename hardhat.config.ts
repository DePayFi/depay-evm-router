import { HardhatUserConfig } from 'hardhat/types'
import '@nomiclabs/hardhat-vyper'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-typechain'

import dotenv from 'dotenv'
dotenv.config()

var { DEPAY_MNEMONIC, DEPAY_RPC_URL } = process.env

/*
0.7.5   for DePay
0.5.16  for Uniswap
0.6.0   for StakingPool
0.6.2   for StakingPool
0.6.6   for Uniswap
0.6.12  for StakingPool
0.4.18  for WETH
*/
const compilers = ['0.4.18', '0.5.16', '0.6.0', '0.6.2', '0.6.6', '0.6.12', '0.7.5'].map((item: string) => ({
  version: item,
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}))

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    //Do forking mainnet to test
    hardhat: {
      blockGasLimit: 12500000,
      gas: 6500000,
      gasPrice: 2000000000,
      accounts: {
        mnemonic: (DEPAY_MNEMONIC || '').trim(),
        path: "m/44'/60'/0'/0"
      },
      forking: {
        url: (DEPAY_RPC_URL || '').trim(),
        enabled: true
      }
    }
  },
  solidity: {
    compilers
  },
  vyper: {
    version: '0.2.8' // CurveFi
  }
}

export default config
