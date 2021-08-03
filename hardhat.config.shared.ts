import '@nomiclabs/hardhat-waffle'
import 'hardhat-typechain'
import 'solidity-coverage'
import { HardhatUserConfig } from 'hardhat/types'

import dotenv from 'dotenv'
dotenv.config()

var { MNEMONIC, ETHEREUM_RPC_URL } = process.env

const config: HardhatUserConfig = {
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

export {
  config,
  MNEMONIC,
  ETHEREUM_RPC_URL
}
