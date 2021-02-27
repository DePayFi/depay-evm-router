import chai, { expect } from 'chai'

import { 
  solidity,
  loadFixture,
} from 'ethereum-waffle'

import { saleEventFixture } from './fixtures/saleEvent'

import {
  route,
} from './functions'

import {
  ETH,
  now,
} from './utils'

chai.use(solidity)

describe('DePayRouterV1 + DePayRouterV1SaleEvent01', () => {

  it('emits a Sale event if requested via plugin', async () => {
    const {
      otherWallet,
      ownerWallet,
      paymentPlugin,
      router,
      saleEventPlugin,
      token0,
      token1,
      uniswapPlugin,
      uniswapRouter,
      WETH,
    } = await loadFixture(saleEventFixture)

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
        addresses: [ownerWallet.address],
        plugins: [uniswapPlugin.address, paymentPlugin.address, saleEventPlugin.address]
      })
    ).to.emit(saleEventPlugin, 'Sale')
    .withArgs(
      ownerWallet.address
    )
  })
})
