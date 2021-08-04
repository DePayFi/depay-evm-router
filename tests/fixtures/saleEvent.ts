//@ts-ignore
import { waffle } from 'hardhat'

const { deployContract } = waffle

import { uniswapPairFixture } from './uniswap'

import DePayRouterV1SaleEvent01 from '../../artifacts/contracts/DePayRouterV1SaleEvent01.sol/DePayRouterV1SaleEvent01.json'

export async function saleEventFixture() {
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
  const saleEventPlugin = await deployContract(ownerWallet, DePayRouterV1SaleEvent01)
  await configuration.connect(ownerWallet).approvePlugin(saleEventPlugin.address)
  return {
    configuration,
    otherWallet,
    ownerWallet,
    paymentPlugin,
    router,
    saleEventPlugin,
    token0,
    token1,
    uniswapFactory,
    uniswapPlugin,
    uniswapRouter,
    WETH,
  }
}
