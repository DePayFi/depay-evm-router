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
    const {router, ownerWallet, otherWallet, paymentPlugin} = await loadFixture(paymentFixture)
    
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

  it('allows the contract owner to add plugins', async () => {
    const {router, otherWallet, paymentPlugin} = await loadFixture(paymentFixture)

    expect(await router.isApproved(paymentPlugin.address)).to.eq(true)
    expect(await router.isApproved(otherWallet.address)).to.eq(false)
  })

  it('emits PluginApproved when approving new plugins', async () => {
    const {configuration, paymentPlugin} = await loadFixture(paymentFixture)

    await expect(
      configuration.approvePlugin(paymentPlugin.address)
    ).to.emit(configuration, 'PluginApproved')
    .withArgs(
      paymentPlugin.address
    );
  })

  it('does NOT allow others to add plugins', async () => {
    const {configuration, otherWallet, paymentPlugin} = await loadFixture(paymentFixture)

    await expect(
      configuration.connect(otherWallet).approvePlugin(paymentPlugin.address)
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
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
