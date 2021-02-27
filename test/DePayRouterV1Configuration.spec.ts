import chai, { expect } from 'chai'

import { 
  solidity,
  deployMockContract,
  loadFixture,
} from 'ethereum-waffle'

import { paymentFixture } from './fixtures/payment'
import { routerFixture } from './fixtures/router'
import { testTokenFixture } from './fixtures/testToken'
  
import {
  route,
} from './functions'

import {
  ETH,
  MAXINT,
} from './utils'

import IDePayRouterV1 from '../artifacts/contracts/interfaces/IDePayRouterV1.sol/IDePayRouterV1.json'

chai.use(solidity)

describe('DePayRouterV1', () => {

  it('allows the contract owner to add plugins', async () => {
    const {router, otherWallet, paymentPlugin} = await loadFixture(paymentFixture)

    expect(await router.isApproved(paymentPlugin.address)).to.eq(true)
    expect(await router.isApproved(otherWallet.address)).to.eq(false)
  })

  it('emits PluginApproved when approving a new plugin', async () => {
    const {configuration, paymentPlugin} = await loadFixture(paymentFixture)

    await expect(
      configuration.approvePlugin(paymentPlugin.address)
    ).to.emit(configuration, 'PluginApproved')
    .withArgs(
      paymentPlugin.address
    );
  })

  it('fails when trying to use a plugin that is not approved', async () => {
    const {router, configuration, ownerWallet, otherWallet} = await loadFixture(paymentFixture)
    
    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [ETH],
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        plugins: [otherWallet.address],
        value: 1000
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Plugin not approved'
    )
  })

  it('does NOT allow others to add plugins', async () => {
    const {configuration, otherWallet, paymentPlugin} = await loadFixture(paymentFixture)

    await expect(
      configuration.connect(otherWallet).approvePlugin(paymentPlugin.address)
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })

  it('fails when trying to use a plugin that is not approved', async () => {
    const {router, configuration, ownerWallet, otherWallet} = await loadFixture(paymentFixture)
    
    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [ETH],
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        plugins: [otherWallet.address],
        value: 1000
      })
    ).to.be.revertedWith(
      'VM Exception while processing transaction: revert DePay: Plugin not approved'
    )
  })

  it('also allows the contract owner to disapprove plugins', async () => {
    const {configuration, router, ownerWallet, paymentPlugin} = await loadFixture(paymentFixture)

    expect(await router.isApproved(paymentPlugin.address)).to.eq(true)
    await configuration.connect(ownerWallet).disapprovePlugin(paymentPlugin.address)
    expect(await router.isApproved(paymentPlugin.address)).to.eq(false)
  })

  it('emits PluginDisapproved when disapproving a plugin', async () => {
    const {configuration, paymentPlugin} = await loadFixture(paymentFixture)

    await expect(
      configuration.disapprovePlugin(paymentPlugin.address)
    ).to.emit(configuration, 'PluginDisapproved')
    .withArgs(
      paymentPlugin.address
    );
  })
})
