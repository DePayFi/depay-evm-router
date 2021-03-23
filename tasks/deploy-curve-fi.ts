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

const tokenAddresses = {
  ropsten: {
    DAI: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
    USDC: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
    USDT: '0x6EE856Ae55B6E1A249f04cd3b947141bc146273c',
    SETH: '0x0Df1B6d92feBCA3B2793AfA3649868991CC4901D'
  }
}

task('curvefi:deploy', "Deploy CurveFi on given network").setAction(async (_args: any, hre: HardhatRuntimeEnvironment) => {
  const db = new JsonDb()
  const [owner] = await hre.ethers.getSigners()

  async function contractDeploy(contractName: string, ...params: any[]) {
    const instanceFactory = await hre.ethers.getContractFactory(contractName)
    const instance = await instanceFactory.connect(owner).deploy(...params)
    db.set(contractName, instance.address)
    console.log('Deploy', contractName, 'at', instance.address)
    return instance
  }

  async function contractGet(contractName: string) {
    const instanceFactory = await hre.ethers.getContractFactory(contractName)
    const instance = instanceFactory.attach(db.get(contractName))
    console.log('Load', contractName, 'at', instance.address)
    return instance
  }

  async function deployIfNotExist(contractName: string, ...params: any[]) {
    return !db.has(contractName) ? contractDeploy(contractName, ...params) : contractGet(contractName)
  }

  const instanceAddressProvider = <AddressProvider>await deployIfNotExist('AddressProvider', owner.address)

  const instanceCalculator = <CurveCalc>await deployIfNotExist('CurveCalc')
  const instanceGaugeControllerMock = <GaugeControllerMock>await deployIfNotExist('GaugeControllerMock')
  const instancePoolInfo = <PoolInfo>await deployIfNotExist('PoolInfo', instanceAddressProvider.address)
  const instanceRegistry = <Registry>(
    await deployIfNotExist('Registry', instanceAddressProvider.address, instanceGaugeControllerMock.address)
  )
  await instanceAddressProvider.connect(owner).add_new_id(instanceRegistry.address, 'CurveFi Registry')
  await instanceAddressProvider.connect(owner).set_address(0, instanceRegistry.address)
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
    await deployIfNotExist('DePayRouterV1CurveFiSwap01', tokenAddresses.ropsten.SETH, instanceSwaps.address)
  )
})
