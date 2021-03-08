import chai, { expect } from 'chai'

import { 
  solidity,
  loadFixture,
} from 'ethereum-waffle'

import { cureFiSwapFixture } from './fixtures/curvefi-swap'

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
     cureFiSwap,
     ownerWallet
    } = await loadFixture(cureFiSwapFixture)

    let path = [ownerWallet.address]
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

})
