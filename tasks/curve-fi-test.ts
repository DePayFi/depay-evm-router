import '@nomiclabs/hardhat-ethers'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { JsonDb } from './helpers/json-db'
import { AddressProvider } from '../typechain/AddressProvider'
import { CurveCalc } from '../typechain/CurveCalc'
import { GaugeControllerMock } from '../typechain/GaugeControllerMock'
import { PoolInfo } from '../typechain/PoolInfo'
import { Registry } from '../typechain/Registry'
import { Swaps } from '../typechain/Swaps'
import { LpToken } from '../typechain/LpToken'
import { StableSwap3Pool } from '../typechain/StableSwap3Pool'
import { DePayRouterV1CurveFiSwap01 } from '../typechain/DePayRouterV1CurveFiSwap01'
import { DePayRouterV1 } from '../typechain/DePayRouterV1'
import { DePayRouterV1Configuration } from '../typechain/DePayRouterV1Configuration'

const addresses = {
  ropsten: {
    owner: '0x317D875cA3B9f8d14f960486C0d1D1913be74e90',
    configuration: '0x7974d891822709cf8B1fCB2891AfA9d1BD836D19',
    depayRouterv1: '0x82154Ea9C2DC4C06D6719cE08728F5cFC9422B1D'
  }
}

task('curvefi:test', 'Deploy CurveFi on given network').setAction(
  async (_args: any, hre: HardhatRuntimeEnvironment) => {
    // If network is ropsten we will load deployed contracts
    const db = new JsonDb(hre.network.name === 'ropsten')
    const [owner] = await hre.ethers.getSigners()
    const tokenName = ['tokenA', 'tokenB', 'tokenC']

    async function contractDeploy(contractName: string, ...params: any[]) {
      const instanceFactory =
        tokenName.indexOf(contractName) >= 0
          ? await hre.ethers.getContractFactory('TestToken')
          : await hre.ethers.getContractFactory(contractName)
      const instance = await instanceFactory.connect(owner).deploy(...params)
      db.set(contractName, instance.address)
      console.log('Deploy', contractName, 'at', instance.address)
      return instance
    }

    async function contractGet(contractName: string) {
      const instanceFactory =
        tokenName.indexOf(contractName) >= 0
          ? await hre.ethers.getContractFactory('TestToken')
          : await hre.ethers.getContractFactory(contractName)
      const instance = instanceFactory.attach(db.get(contractName))
      console.log('Load', contractName, 'at', instance.address)
      return instance
    }

    async function deployIfNotExist(contractName: string, ...params: any[]) {
      return !db.has(contractName) ? contractDeploy(contractName, ...params) : contractGet(contractName)
    }

    // Deploy needed contracts of CurveFi
    const instanceAddressProvider = <AddressProvider>await deployIfNotExist('AddressProvider', owner.address)
    const instanceCalculator = <CurveCalc>await deployIfNotExist('CurveCalc')
    const instanceGaugeControllerMock = <GaugeControllerMock>await deployIfNotExist('GaugeControllerMock')
    const instancePoolInfo = <PoolInfo>await deployIfNotExist('PoolInfo', instanceAddressProvider.address)
    const instanceRegistry = <Registry>(
      await deployIfNotExist('Registry', instanceAddressProvider.address, instanceGaugeControllerMock.address)
    )
    // Add registry to address provider
    await instanceAddressProvider.connect(owner).add_new_id(instanceRegistry.address, 'CurveFi Registry')
    await instanceAddressProvider.connect(owner).set_address(0, instanceRegistry.address)
    const instanceSwaps = <Swaps>(
      await deployIfNotExist('Swaps', instanceAddressProvider.address, instanceCalculator.address)
    )
    const instanceLpToken = <LpToken>await deployIfNotExist('LpToken', 'CurveFi', 'CRV', 18, 0)

    // Deploy test token
    const tokenA = await deployIfNotExist('tokenA')
    const tokenB = await deployIfNotExist('tokenB')
    const tokenC = await deployIfNotExist('tokenC')
    const tokenSETH = await deployIfNotExist('WETH9')

    /*
    def __init__(
        _owner: address,
        _coins: address[N_COINS],
        _pool_token: address,
        _A: uint256,
        _fee: uint256,
        _admin_fee: uint256
    ):*/
    const instanceSwap3Pool = <StableSwap3Pool>(
      await deployIfNotExist(
        'StableSwap3Pool',
        owner.address,
        [tokenA.address, tokenB.address, tokenC.address],
        instanceLpToken.address,
        100,
        4000000,
        0
      )
    )

    /*
    @external
    def add_pool_without_underlying(
      _pool: address,
      _n_coins: uint256,
      _lp_token: address,
      _rate_method_id: bytes32,
      _decimals: uint256,
      _use_rates: uint256,
      _has_initial_A: bool,
      _is_v1: bool,
    )*/
    await instanceRegistry
      .connect(owner)
      .add_pool_without_underlying(
        instanceSwap3Pool.address,
        3,
        instanceLpToken.address,
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        0,
        0,
        false,
        false
      )

    if ((await instanceLpToken.minter()).toLowerCase() === owner.address.toLowerCase()) {
      console.log('>> Transfer minter role to pool:', instanceSwap3Pool.address)
      // Set minter for pool token
      await instanceLpToken.connect(owner).set_minter(instanceSwap3Pool.address)
    }

    if ((await tokenA.balanceOf(instanceSwap3Pool.address)).eq(0)) {
      console.log('>> Add liquidity of [tokenA, tokenB, tokenC] to pool')
      await tokenA.connect(owner).approve(instanceSwap3Pool.address, '100000000000000000000')
      await tokenB.connect(owner).approve(instanceSwap3Pool.address, '100000000000000000000')
      await tokenC.connect(owner).approve(instanceSwap3Pool.address, '100000000000000000000')
      await instanceSwap3Pool
        .connect(owner)
        .add_liquidity(['10000000000000000000', '10000000000000000000', '10000000000000000000'], 0, {
          gasLimit: 4000000
        })
    }

    const curveFiPlugin = <DePayRouterV1CurveFiSwap01>(
      await deployIfNotExist('DePayRouterV1CurveFiSwap01', tokenSETH.address, instanceSwaps.address)
    )

    const depayRouterV1Factory = await hre.ethers.getContractFactory('DePayRouterV1')
    const depayRouterV1 = <DePayRouterV1>depayRouterV1Factory.attach(addresses.ropsten.depayRouterv1)

    // Approve plugin if network is hardhat
    if (hre.network.name === 'hardhat') {
      console.log('>> We are on', hre.network.name, ', we will try to perform approve plugin')

      const depayRouterConfigurationFactory = await hre.ethers.getContractFactory('DePayRouterV1Configuration')
      const depayRouterConfiguration = <DePayRouterV1Configuration>(
        depayRouterConfigurationFactory.attach(addresses.ropsten.configuration)
      )

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [addresses.ropsten.owner]
      })

      await depayRouterConfiguration
        .connect(await hre.ethers.provider.getSigner(addresses.ropsten.owner))
        .approvePlugin(curveFiPlugin.address)
    }

    if (await depayRouterV1.isApproved(curveFiPlugin.address)) {
      if ((await tokenA.allowance(owner.address, curveFiPlugin.address)).lte(1000)) {
        console.log('>> Allowing DepayRouterV1 to move fund')
        await tokenA.connect(owner).approve(depayRouterV1.address, '100000000000000000000')
      }

      await depayRouterV1
        .connect(owner)
        .route([tokenA.address, tokenB.address], [1000, 100], [instanceSwap3Pool.address], [curveFiPlugin.address], [])
      console.log('>> Completed swap!!')
    } else {
      console.log("Plugin wasn't approved")
    }
  }
)
