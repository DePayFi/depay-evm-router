import { HardhatUserConfig } from 'hardhat/types'
import { config } from './hardhat.config.shared'

const hardhatConfig: HardhatUserConfig = {
  ...config
}

export default hardhatConfig
