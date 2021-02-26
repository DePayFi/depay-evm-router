import {
  BigNumber,
  Contract,
  Wallet,
} from 'ethers'

import { 
  deployContract,
  MockProvider,
} from 'ethereum-waffle'

import {
  createUniswapPair,
  MAXINT,
} from './utils'

import DePayRouterV1 from '../../artifacts/contracts/DePayRouterV1.sol/DePayRouterV1.json'
import DePayRouterV1ApproveAndCallContractAddressAmount01 from '../../artifacts/contracts/DePayRouterV1ApproveAndCallContractAddressAmount01.sol/DePayRouterV1ApproveAndCallContractAddressAmount01.json'
import DePayRouterV1Configuration from '../../artifacts/contracts/DePayRouterV1Configuration.sol/DePayRouterV1Configuration.json'
import DePayRouterV1Payment01 from '../../artifacts/contracts/DePayRouterV1Payment01.sol/DePayRouterV1Payment01.json'
import DePayRouterV1PaymentEvent01 from '../../artifacts/contracts/DePayRouterV1PaymentEvent01.sol/DePayRouterV1PaymentEvent01.json'
import DePayRouterV1Uniswap01 from '../../artifacts/contracts/DePayRouterV1Uniswap01.sol/DePayRouterV1Uniswap01.json'
import StakingPool from '../../artifacts/contracts/test/StakingPool.sol/StakingPool.json'
import TestToken from '../../artifacts/contracts/test/TestToken.sol/TestToken.json'
import UniswapV2Factory from '../../artifacts/contracts/test/UniswapV2Factory.sol/UniswapV2Factory.json'
import UniswapV2Router02 from '../../artifacts/contracts/test/UniswapV2Router02.sol/UniswapV2Router02.json'
import WETH9 from '../../artifacts/contracts/test/WETH9.sol/WETH9.json'

const provider = new MockProvider({
  ganacheOptions: {
    mnemonic: 'pay pay pay pay pay pay pay pay pay pay pay pay',
    allowUnlimitedContractSize: true // as UniswapV2Router02 is just too big
  }
})

const [ownerWallet, otherWallet] = provider.getWallets()

export async function routerFixture() {  
  const configuration = await deployContract(ownerWallet, DePayRouterV1Configuration)
  const router = await deployContract(ownerWallet, DePayRouterV1, [configuration.address])
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet
  }
}

export async function paymentFixture() {
  const {router, configuration, ownerWallet, otherWallet} = await routerFixture()
  const paymentPlugin = await deployContract(ownerWallet, DePayRouterV1Payment01)
  await configuration.connect(ownerWallet).approvePlugin(paymentPlugin.address)
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet,
    paymentPlugin
  }
}

export async function testTokenFixture() {
  const {router, configuration, ownerWallet, otherWallet} = await routerFixture()
  const testTokenContract = await deployContract(ownerWallet, TestToken)
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet,
    testTokenContract,
  }
}

export async function paymentAndTestTokenFixture() {
  const {router, configuration, ownerWallet, otherWallet, paymentPlugin} = await paymentFixture()
  const testTokenContract = await deployContract(ownerWallet, TestToken)
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet,
    paymentPlugin,
    testTokenContract,
  }
}

export async function paymentEventFixture() {
  const {router, configuration, ownerWallet, otherWallet, paymentPlugin} = await paymentFixture()
  const paymentEventPlugin = await deployContract(ownerWallet, DePayRouterV1PaymentEvent01)
  await configuration.connect(ownerWallet).approvePlugin(paymentEventPlugin.address)
  return {
    router,
    configuration,
    ownerWallet,
    otherWallet,
    paymentPlugin,
    paymentEventPlugin,
  }
}

export async function unapprovedUniswapFixture() {
  const {router, configuration, ownerWallet, otherWallet} = await routerFixture()
  const WETH = await deployContract(ownerWallet, WETH9)
  const uniswapFactory = await deployContract(ownerWallet, UniswapV2Factory, [ownerWallet.address])
  const uniswapRouter = await deployContract(ownerWallet, UniswapV2Router02, [uniswapFactory.address, WETH.address])
  const uniswapPlugin = await deployContract(ownerWallet, DePayRouterV1Uniswap01, [WETH.address, uniswapRouter.address])
  return {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    uniswapFactory,
    uniswapPlugin,
    uniswapRouter,
    WETH,
  } 
}

export async function uniswapFixture() {
  const {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    uniswapFactory,
    uniswapPlugin,
    uniswapRouter,
    WETH,
  } = await unapprovedUniswapFixture()
  await configuration.connect(ownerWallet).approvePlugin(uniswapPlugin.address)
  return {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    uniswapFactory,
    uniswapPlugin,
    uniswapRouter,
    WETH,
  }
}

export async function uniswapPairFixture() {
  const {
    router,
    configuration,
    ownerWallet,
    otherWallet,
    uniswapRouter,
    uniswapFactory,
    uniswapPlugin,
    WETH,
  } = await uniswapFixture()

  const paymentPlugin = await deployContract(ownerWallet, DePayRouterV1Payment01)
  await configuration.connect(ownerWallet).approvePlugin(paymentPlugin.address)

  const token0 = await deployContract(ownerWallet, TestToken)
  await createUniswapPair({
    token0: WETH,
    token1: token0,
    WETH,
    router: uniswapRouter,
    wallet: ownerWallet,
    uniswapFactory: uniswapFactory
  })

  const token1 = await deployContract(ownerWallet, TestToken)
  await createUniswapPair({
    token0: WETH,
    token1: token1,
    WETH,
    router: uniswapRouter,
    wallet: ownerWallet,
    uniswapFactory: uniswapFactory
  })

  await token0.connect(ownerWallet).approve(router.address, MAXINT)

  return {
    configuration,
    otherWallet,
    ownerWallet,
    paymentPlugin,
    router,
    token0,
    token1,
    uniswapFactory,
    uniswapPlugin,
    uniswapRouter,
    WETH,
  }
}

export async function uniswapPairAndCallContractFixture() {
  const {
    configuration,
    otherWallet,
    ownerWallet,
    paymentPlugin,
    router,
    token0,
    token1,
    uniswapFactory,
    uniswapPlugin,
    uniswapRouter,
    WETH,
  } = await uniswapPairFixture()

  const contractCallPlugin = await deployContract(ownerWallet, DePayRouterV1ApproveAndCallContractAddressAmount01)
  await configuration.connect(ownerWallet).approvePlugin(contractCallPlugin.address)

  const exampleContract = await deployContract(ownerWallet, StakingPool)
  await exampleContract.initialize(token1.address)

  return {
    configuration,
    contractCallPlugin,
    exampleContract,
    otherWallet,
    ownerWallet,
    paymentPlugin,
    router,
    token0,
    token1,
    uniswapFactory,
    uniswapPlugin,
    uniswapRouter,
    WETH,
  }
}
