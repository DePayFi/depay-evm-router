import chai, { expect } from 'chai'

import { 
  solidity,
  deployMockContract,
  loadFixture,
} from 'ethereum-waffle'

import {
  uniswapFixture,
  uniswapPairAndCallContractFixture,
  uniswapPairFixture,
} from './shared/fixtures'

import {
  route,
} from './shared/functions'

import {
  now,
  ETH,
  MAXINT,
} from './shared/utils'

import IDePayRouterV1 from '../artifacts/contracts/interfaces/IDePayRouterV1.sol/IDePayRouterV1.json'

const { ethers } = require("hardhat")

chai.use(solidity)

describe('DePayRouterV1 + DePayRouterV1Uniswap01', () => {

  it('swaps tokens via uniswap before performing a payment', async () => {
    const {
      otherWallet,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      token1,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairFixture)

    let path = [token0.address, WETH.address, token1.address]
    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, path)
    let amountIn = amounts[0].toNumber()

    await expect(() => 
      route({
        router,
        wallet: ownerWallet,
        path: path,
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address]
      })
    ).to.changeTokenBalance(token1, otherWallet, 1000)
  })

  it('fails when a miner withholds a swap and executes the payment transaction after the deadline has been reached', async () => {
    const {
      otherWallet,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      token1,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairFixture)

    let path = [token0.address, WETH.address, token1.address]
    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, path)
    let amountIn = amounts[0].toNumber()

    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: path,
        amounts: [
          amountIn,
          amountOut,
          now() - 1000 // deadline in the past
        ],
        addresses: [otherWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address]
      })
    ).to.be.revertedWith(
      'UniswapV2Router: EXPIRED'
    )
  })

  it('swaps ETH to token via uniswap before performing a payment', async () => {
    const {
      otherWallet,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairFixture)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [WETH.address, token0.address])
    let amountIn = amounts[0].toNumber()

    await expect(() => 
      route({
        router,
        wallet: ownerWallet,
        path: [ETH, token0.address],
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address],
        value: amountIn
      })
    ).to.changeTokenBalance(token0, otherWallet, amountOut)
  })

  it('swaps tokens for ETH via uniswap before performing a payment', async () => {
    const {
      otherWallet,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairFixture)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [token0.address, WETH.address])
    let amountIn = amounts[0].toNumber()

    await expect(() => 
      route({
        router,
        wallet: ownerWallet,
        path: [token0.address, ETH],
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [otherWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address],
        value: amountIn
      })
    ).to.changeEtherBalance(otherWallet, amountOut)
  })

  it('swaps tokens to tokens via uniswap and pays the resulting tokens into a contract', async () => {
    const {
      contractCallPlugin,
      exampleContract,
      ownerWallet,
      paymentPlugin,
      router,
      token0,
      token1,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(uniswapPairAndCallContractFixture)

    let path = [token0.address, WETH.address, token1.address]
    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, path)
    let amountIn = amounts[0].toNumber()

    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: path,
        amounts: [
          amountIn,
          amountOut,
          now()+10000 // deadline
        ],
        addresses: [ownerWallet.address, exampleContract.address],
        data: ["depositFor(address,uint256)"],
        plugins: [uniswapPlugin.address, contractCallPlugin.address]
      })
    ).to.emit(exampleContract, 'Deposit')
    .withArgs(
      ownerWallet.address,
      amountOut
    )
  })
})
