import chai, { expect } from 'chai'

import { 
  solidity,
  loadFixture,
} from 'ethereum-waffle'

import { paymentAndTestTokenFixture } from './fixtures/paymentAndTestToken'
import { paymentFixture } from './fixtures/payment'

import {
  route,
} from './functions'

import {
  ETH,
  MAXINT,
} from './utils'

chai.use(solidity)

describe('DePayRouterV1 + DePayRouterV1Payment01', () => {

  it('allows to perform simple ETH payments without conversion', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin} = await loadFixture(paymentAndTestTokenFixture)
    
    await expect(
      await route({
        router,
        wallet: ownerWallet,
        path: [ETH],
        amounts: [1000, 1000],
        addresses: [ownerWallet.address, otherWallet.address],
        plugins: [paymentPlugin.address],
        value: 1000
      })
    ).to.changeEtherBalance(otherWallet, 1000)
  })

  it('allows for direct token transfers without performing any conversion', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin, testTokenContract} = await loadFixture(paymentAndTestTokenFixture)    
    
    await testTokenContract.connect(ownerWallet).approve(router.address, 1000)
    await expect(() => 
      route({
        router,
        wallet: ownerWallet,
        path: [testTokenContract.address],
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        plugins: [paymentPlugin.address]
      })
    ).to.changeTokenBalance(testTokenContract, otherWallet, 1000)
  })

  it('allows for direct token transfers without performing any conversion', async () => {
    const {router, ownerWallet, otherWallet, paymentPlugin, testTokenContract} = await loadFixture(paymentAndTestTokenFixture)    
    
    await testTokenContract.connect(ownerWallet).approve(router.address, 1000)
    await expect(() => 
      route({
        router,
        wallet: ownerWallet,
        path: [testTokenContract.address],
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        plugins: [paymentPlugin.address]
      })
    ).to.changeTokenBalance(testTokenContract, otherWallet, 1000)
  })
})
