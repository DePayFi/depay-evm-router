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
  MAXINT,
} from '../utils'

import { routerFixture } from './router'

import DePayRouterV1ApproveAndCallContractAddressAmount01 from '../../artifacts/contracts/DePayRouterV1ApproveAndCallContractAddressAmount01.sol/DePayRouterV1ApproveAndCallContractAddressAmount01.json'
import DePayRouterV1Payment01 from '../../artifacts/contracts/DePayRouterV1Payment01.sol/DePayRouterV1Payment01.json'
import DePayRouterV1Uniswap01 from '../../artifacts/contracts/DePayRouterV1Uniswap01.sol/DePayRouterV1Uniswap01.json'
import StakingPool from '../../artifacts/contracts/test/StakingPool.sol/StakingPool.json'
import TestToken from '../../artifacts/contracts/test/TestToken.sol/TestToken.json'
import UniswapV2Factory from '../../artifacts/contracts/test/UniswapV2Factory.sol/UniswapV2Factory.json'
import UniswapV2Router02 from '../../artifacts/contracts/test/UniswapV2Router02.sol/UniswapV2Router02.json'
import WETH9 from '../../artifacts/contracts/test/WETH9.sol/WETH9.json'

interface createUniswapPairParameters {
  token0: Contract,
  token1: Contract,
  WETH: Contract,
  router: Contract,
  wallet: Wallet,
  uniswapFactory: Contract
}

export async function createUniswapPair({
  token0,
  token1,
  WETH,
  router,
  wallet,
  uniswapFactory
}: createUniswapPairParameters) {
  if(token0 != WETH) {
    await token0.connect(wallet).transfer(wallet.address, 1000000)
    await token0.connect(wallet).approve(router.address, MAXINT)
  }
  
  if(token1 == WETH) { throw 'token1 is not allowed to be WETH, use token0 instead!' }
  await token1.connect(wallet).transfer(wallet.address, 1000000)
  await token1.connect(wallet).approve(router.address, MAXINT)

  await uniswapFactory.createPair(token0.address, token1.address)
  const pairAddress = await uniswapFactory.getPair(token0.address, token1.address)
  
  if(token0 == WETH) {
    await router.connect(wallet).addLiquidityETH(
      token1.address,
      1000000,
      1000000,
      1000000,
      wallet.address,
      MAXINT,
      {value: 1000000}
    )
  } else {
    await router.connect(wallet).addLiquidity(
      token0.address,
      token1.address,
      1000000,
      1000000,
      1000000,
      1000000,
      wallet.address,
      MAXINT
    )
  }

  return pairAddress
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
