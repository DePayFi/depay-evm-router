import { HardhatUserConfig } from 'hardhat/types'
import '@nomiclabs/hardhat-vyper'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-typechain'

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      blockGasLimit: 12500000,
      gas: 6500000,
      gasPrice: 2000000000
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
    version: '0.2.8' // CurveFi
  }
}

export default config
