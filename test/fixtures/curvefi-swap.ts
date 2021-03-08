import { BigNumber, Contract, Wallet } from 'ethers'

import { deployContract, MockProvider } from 'ethereum-waffle'

import { MAXINT } from '../utils'

import { routerFixture } from './router'


import CurveFiSwap from '../../artifacts/contracts/curve-fi/Swaps.vy/Swaps.json'

import DePayRouterV1Uniswap01 from '../../artifacts/contracts/DePayRouterV1Uniswap01.sol/DePayRouterV1Uniswap01.json'
import TestToken from '../../artifacts/contracts/test/TestToken.sol/TestToken.json'
import DePayRouterV1CurveFiSwap01 from '../../artifacts/contracts/DePayRouterV1CurveFiSwap01.sol/DePayRouterV1CurveFiSwap01.json'
import WETH9 from '../../artifacts/contracts/test/WETH9.sol/WETH9.json'

export async function unapprovedCureFiFixture() {
  const { router, configuration, ownerWallet, otherWallet } = await routerFixture()
  // Use WETH as faking of SETH
  const SETH = await deployContract(ownerWallet, WETH9)
  const cureFiSwap = await deployContract(ownerWallet, CurveFiSwap)
  const uniswapPlugin = await deployContract(ownerWallet, DePayRouterV1Uniswap01, [SETH.address, cureFiSwap.address])
  return {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    uniswapPlugin,
    cureFiSwap,
    SETH
  }
}

export async function cureFiFixture() {
  const {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    uniswapPlugin,
    cureFiSwap,
    SETH
  } = await unapprovedCureFiFixture()
  await configuration.connect(ownerWallet).approvePlugin(uniswapPlugin.address)
  return {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    uniswapPlugin,
    cureFiSwap,
    SETH
  }
}

export async function cureFiSwapFixture() {
  const { configuration, otherWallet, ownerWallet, router, uniswapPlugin, cureFiSwap, SETH } = await cureFiFixture()




  const curveFiPlugin = await deployContract(ownerWallet, DePayRouterV1CurveFiSwap01)

  await configuration.connect(ownerWallet).approvePlugin(curveFiPlugin.address)

  const fromToken = await deployContract(ownerWallet, TestToken)

  const toToken = await deployContract(ownerWallet, TestToken)

  await fromToken.connect(ownerWallet).approve(router.address, MAXINT)

  return {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    uniswapPlugin,
    cureFiSwap,
    SETH,
    toToken,
    fromToken
  }
}
