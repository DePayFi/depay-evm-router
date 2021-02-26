import chai, { expect } from 'chai'

import { 
  solidity,
  loadFixture,
} from 'ethereum-waffle'

import { uniswapPairFixture } from './fixtures/uniswap'

import {
  route,
} from './functions'

import {
  now,
  ETH
} from './utils'

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

  it('swaps tokens via uniswap and sends them back to purchaser as token sale', async () => {
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
        addresses: [ownerWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address]
      })
    ).to.changeTokenBalance(token1, ownerWallet, 1000)
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

  it('makes sure that the eth balance in the smart contract is >= after the payment compared to before', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin, token0, uniswapRouter, WETH} = await loadFixture(uniswapPairFixture)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [token0.address, WETH.address])
    let amountIn = amounts[0].toNumber()

    await ownerWallet.sendTransaction({to: router.address, value: 1000})

    await expect(
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
        plugins: [paymentPlugin.address]
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Insufficient balance after payment!'
    )
  })

  it('makes sure that the token balance in the smart contract is >= after the payment compared to before', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin, token0, uniswapRouter, WETH} = await loadFixture(uniswapPairFixture)

    let amountOut = 1000
    let amounts = await uniswapRouter.getAmountsIn(amountOut, [WETH.address, token0.address])
    let amountIn = amounts[0].toNumber()

    await token0.connect(ownerWallet).transfer(router.address, 5000)

    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [ETH, token0.address],
        amounts: [
          amountIn,
          amountOut,
          now()+10000
        ],
        addresses: [otherWallet.address],
        plugins: [paymentPlugin.address],
        value: amountIn
      })    
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Insufficient balance after payment!'
    )
  })
})
