import { HardhatUserConfig } from 'hardhat/types'
import { config } from './hardhat.config.shared'

const hardhatConfig: HardhatUserConfig = {
  ...config,
  hardhat: {
    blockGasLimit: 12500000,
    gas: 6500000,
    gasPrice: 2000000000,
    hardfork: 'berlin'
  }
}

export default hardhatConfig
