import chai, { expect } from 'chai'

import { 
  solidity,
  loadFixture,
} from 'ethereum-waffle'

import { paymentEventFixture } from './fixtures/paymentEvent'

import {
  route,
} from './functions'

import {
  ETH,
} from './utils'

chai.use(solidity)

describe('DePayRouterV1 + DePayRouterV1PaymentEvent01', () => {

  it('emits a Payment event if requested via plugin', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin, paymentEventPlugin} = await loadFixture(paymentEventFixture)
    
    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [ETH],
        amounts: [1000, 1000],
        addresses: [ownerWallet.address, otherWallet.address],
        plugins: [paymentPlugin.address, paymentEventPlugin.address],
        value: 1000
      })
    ).to.emit(paymentEventPlugin, 'Payment')
    .withArgs(
      ownerWallet.address,
      otherWallet.address
    );
  })
})
