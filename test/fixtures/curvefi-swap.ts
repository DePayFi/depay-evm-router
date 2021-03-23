import { BigNumber, Contract, Wallet } from 'ethers'

//@ts-ignore
import { waffle } from 'hardhat'

const { deployContract } = waffle

import { MAXINT } from '../utils'

import { routerFixture } from './router'

import CurveFiRegistryMock from '../../artifacts/contracts/test/CurveFiRegistryMock.sol/CurveFiRegistryMock.json'
import CurveFiPoolMock from '../../artifacts/contracts/test/CurveFiPoolMock.sol/CurveFiPoolMock.json'

import CurveFiSwap from '../../artifacts/contracts/curve-fi/Swaps.vy/Swaps.json'
import CurveFiAddressProvider from '../../artifacts/contracts/curve-fi/AddressProvider.vy/AddressProvider.json'

import DePayRouterV1Payment01 from '../../artifacts/contracts/DePayRouterV1Payment01.sol/DePayRouterV1Payment01.json'
import TestToken from '../../artifacts/contracts/test/TestToken.sol/TestToken.json'
import DePayRouterV1CurveFiSwap01 from '../../artifacts/contracts/DePayRouterV1CurveFiSwap01.sol/DePayRouterV1CurveFiSwap01.json'
import WETH9 from '../../artifacts/contracts/test/WETH9.sol/WETH9.json'

export async function curveFiSystemFixture() {
  const { configuration, ownerWallet } = await routerFixture()
  const curveFiAddressProvider = await deployContract(ownerWallet, CurveFiAddressProvider, [ownerWallet.address])

  const curveFiRegistryMock = await deployContract(ownerWallet, CurveFiRegistryMock)

  //add_new_id(_address: address, _description: String[64])
  await curveFiAddressProvider.connect(ownerWallet).add_new_id(curveFiRegistryMock.address, 'CurveFi Registry')

  return {
    configuration,
    ownerWallet,
    curveFiAddressProvider
  }
}

export async function unapprovedCureFiFixture() {
  const { router, configuration, ownerWallet, otherWallet } = await routerFixture()

  // Use WETH as faking of SETH
  const SETH = await deployContract(ownerWallet, WETH9)

  const curveFiAddressProvider = await deployContract(ownerWallet, CurveFiAddressProvider, [ownerWallet.address])

  const curveFiRegistryMock = await deployContract(ownerWallet, CurveFiRegistryMock)

  await curveFiAddressProvider.connect(ownerWallet).add_new_id(curveFiRegistryMock.address, 'CurveFi Registry')
  await curveFiAddressProvider.connect(ownerWallet).set_address(0, curveFiRegistryMock.address);

  const curveFiSwap = await deployContract(ownerWallet, CurveFiSwap, [
    curveFiAddressProvider.address,
    '0x0000000000000000000000000000000000000000'
  ])

  const curveFiPlugin = await deployContract(ownerWallet, DePayRouterV1CurveFiSwap01, [
    SETH.address,
    curveFiSwap.address
  ])

  return {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    curveFiPlugin,
    curveFiAddressProvider,
    curveFiRegistryMock,
    curveFiSwap,
    SETH
  }
}

export async function cureFiFixture() {
  const {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    curveFiPlugin,
    curveFiAddressProvider,
    curveFiRegistryMock,
    curveFiSwap,
    SETH
  } = await unapprovedCureFiFixture()
  await configuration.connect(ownerWallet).approvePlugin(curveFiPlugin.address)
  return {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    curveFiAddressProvider,
    curveFiRegistryMock,
    curveFiPlugin,
    curveFiSwap,
    SETH
  }
}

export async function cureFiSwapFixture() {
  const {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    curveFiPlugin,
    curveFiSwap,
    SETH,
    curveFiAddressProvider,
    curveFiRegistryMock
  } = await cureFiFixture()

  await configuration.connect(ownerWallet).approvePlugin(curveFiPlugin.address)

  const curveFiPoolMock = await deployContract(ownerWallet, CurveFiPoolMock)

  const fromToken = await deployContract(ownerWallet, TestToken)

  const toToken = await deployContract(ownerWallet, TestToken)

  await fromToken.connect(ownerWallet).approve(router.address, MAXINT)

  await toToken.connect(ownerWallet).transfer(router.address, '1000000')

  await toToken.connect(ownerWallet).transfer(curveFiPoolMock.address, '1000000')

  await curveFiPoolMock.set_coin(0, fromToken.address)

  await curveFiPoolMock.set_coin(1, toToken.address)

  const paymentPlugin = await deployContract(ownerWallet, DePayRouterV1Payment01)
  await configuration.connect(ownerWallet).approvePlugin(paymentPlugin.address)

  return {
    configuration,
    otherWallet,
    ownerWallet,
    router,
    curveFiPlugin,
    curveFiSwap,
    SETH,
    toToken,
    fromToken,
    curveFiPoolMock,
    paymentPlugin,
    curveFiAddressProvider,
    curveFiRegistryMock
  }
}
