import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'

import dotenv from 'dotenv'
dotenv.config()

var {
  MNEMONIC,
  ETHEREUM_RPC_URL,
  POLYGON_RPC_URL,
  BSC_RPC_URL,
  GNOSIS_RPC_URL,
  FANTOM_RPC_URL,
  ARBITRUM_ONE_RPC_URL,
  ARBITRUM_NOVA_RPC_URL,
  OPTIMISM_RPC_URL,
  AVALANCHE_RPC_URL,
  POLYGON_ZKEVM_RPC_URL,
  ZKSYNC_ERA_RPC_URL,
} = process.env

const sharedConfig = {
  solidity: {
    version: '0.8.26',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}

export {
  sharedConfig,
  MNEMONIC,
  ETHEREUM_RPC_URL,
  BSC_RPC_URL,
  POLYGON_RPC_URL,
  GNOSIS_RPC_URL,
  FANTOM_RPC_URL,
  ARBITRUM_ONE_RPC_URL,
  ARBITRUM_NOVA_RPC_URL,
  OPTIMISM_RPC_URL,
  AVALANCHE_RPC_URL,
  POLYGON_ZKEVM_RPC_URL,
  ZKSYNC_ERA_RPC_URL,
}
