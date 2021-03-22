import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { JsonDb } from './helpers/json-db'
import { AddressProvider } from '../typechain/AddressProvider'
import { CurveCalc } from '../typechain/CurveCalc'
import { GaugeControllerMock } from '../typechain/GaugeControllerMock'
import { PoolInfo } from '../typechain/PoolInfo'
import { Registry } from '../typechain/Registry'
import { Swaps } from '../typechain/Swaps'
import { ERC20CRV } from '../typechain/ERC20CRV'
import { StableSwap3Pool } from '../typechain/StableSwap3Pool'
import { DePayRouterV1CurveFiSwap01 } from '../typechain/DePayRouterV1CurveFiSwap01'
import { TestToken } from '../typechain/TestToken'
import { DePayRouterV1 } from '../typechain/DePayRouterV1'
import { DePayRouterV1Configuration } from '../typechain/DePayRouterV1Configuration'

const tokenAddresses = {
  ropsten: {
    DAI: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
    USDC: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
    USDT: '0x6EE856Ae55B6E1A249f04cd3b947141bc146273c',
    SETH: '0x0Df1B6d92feBCA3B2793AfA3649868991CC4901D'
  }
}

task('curvefi:test', 'Test CurveFi when contract was deployed').setAction(
  async (_args: any, hre: HardhatRuntimeEnvironment) => {
    const db = new JsonDb()
    const [owner] = await hre.ethers.getSigners()

    async function contractGet(contractName: string) {
      const instanceFactory = await hre.ethers.getContractFactory(contractName)
      const instance = instanceFactory.attach(db.get(contractName))
      console.log('Load', contractName, 'at', instance.address)
      return instance
    }

    async function TokenAt(tokenAddress: string) {
      const instanceFactory = await hre.ethers.getContractFactory('TestToken')
      const instance = <TestToken>instanceFactory.attach(tokenAddress)
      console.log('Load ERC20 token at', instance.address)
      return instance
    }

    async function deployIfNotExist(contractName: string, ..._params: any[]) {
      if (db.has(contractName)) {
        return contractGet(contractName)
      }
      throw new Error('Contract was not existed')
    }

    const instanceAddressProvider = <AddressProvider>await deployIfNotExist('AddressProvider', owner.address)

    const instanceCalculator = <CurveCalc>await deployIfNotExist('CurveCalc')
    const instanceGaugeControllerMock = <GaugeControllerMock>await deployIfNotExist('GaugeControllerMock')
    const instancePoolInfo = <PoolInfo>await deployIfNotExist('PoolInfo', instanceAddressProvider.address)
    const instanceRegistry = <Registry>(
      await deployIfNotExist('Registry', instanceAddressProvider.address, instanceGaugeControllerMock.address)
    )
    const instanceSwaps = <Swaps>(
      await deployIfNotExist('Swaps', instanceAddressProvider.address, instanceCalculator.address)
    )
    const instanceCRV = <ERC20CRV>await deployIfNotExist('ERC20CRV', 'CurveFi', 'CRV', 18)

    const instanceSwap3Pool = <StableSwap3Pool>(
      await deployIfNotExist(
        'StableSwap3Pool',
        owner.address,
        [tokenAddresses.ropsten.DAI, tokenAddresses.ropsten.USDC, tokenAddresses.ropsten.USDT],
        instanceCRV.address,
        100,
        4000000,
        0
      )
    )

    const curveFiPlugin = <DePayRouterV1CurveFiSwap01>(
      await deployIfNotExist('DePayRouterV1CurveFiSwap01', tokenAddresses.ropsten.SETH, instanceSwap3Pool.address)
    )

    const instanceDai = await TokenAt(tokenAddresses.ropsten.DAI)
    const instanceUsdc = await TokenAt(tokenAddresses.ropsten.USDC)
    const instanceUsdt = await TokenAt(tokenAddresses.ropsten.USDT)

    const depayRouterConfigurationFactory = await hre.ethers.getContractFactory('DePayRouterV1Configuration')
    const depayRouterConfiguration = <DePayRouterV1Configuration>(
      depayRouterConfigurationFactory.attach('0x7974d891822709cf8B1fCB2891AfA9d1BD836D19')
    )

    const depayRouterV1Factory = await hre.ethers.getContractFactory('DePayRouterV1')
    const depayRouterV1 = <DePayRouterV1>depayRouterV1Factory.attach('0x82154Ea9C2DC4C06D6719cE08728F5cFC9422B1D')

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: ['0x317D875cA3B9f8d14f960486C0d1D1913be74e90']
    })

    await depayRouterConfiguration
      .connect(await hre.ethers.provider.getSigner('0x317D875cA3B9f8d14f960486C0d1D1913be74e90'))
      .approvePlugin(curveFiPlugin.address)

    await instanceDai.connect(owner).transfer(instanceSwap3Pool.address, '10000000000000000000')
    await instanceUsdc.connect(owner).approve(depayRouterV1.address, 2000000)
    await depayRouterV1
      .connect(owner)
      .route([instanceUsdc.address, instanceSwap3Pool.address, instanceDai.address], [1000000, 1000], [], [], [])
  }
)
