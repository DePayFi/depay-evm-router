import chai, { expect } from 'chai'

import { 
  solidity,
  loadFixture,
} from 'ethereum-waffle'

import { uniswapPairAndCallContractFixture } from './fixtures/uniswap'

import {
  route,
} from './functions'

import {
  now,
} from './utils'

chai.use(solidity)

describe('DePayRouterV1 + DePayRouterV1ApproveAndCallContractAddressAmount01', () => {

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
