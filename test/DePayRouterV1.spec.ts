import chai, { expect } from 'chai'

import { 
  solidity,
  deployMockContract,
  loadFixture,
} from 'ethereum-waffle'

import {routerFixture} from './fixtures/router'
import {testTokenFixture} from './fixtures/testToken'

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

  it('deploys router successfully', async () => {
    await loadFixture(routerFixture)
  })

  it('makes sure DePayRouterV1 has the same interface as IDePayRouterV1', async () => {
    const {router, ownerWallet} = await loadFixture(routerFixture)
    
    const interfaceContract = await deployMockContract(ownerWallet, IDePayRouterV1.abi)
    let inheritedFragmentNames: string[] = ['OwnershipTransferred', 'transferOwnership', 'owner', 'renounceOwnership']
    let contractFragmentsFiltered = router.interface.fragments.filter(
      function(fragment){
        return inheritedFragmentNames.indexOf(fragment.name) < 0 &&
          fragment.type != 'constructor'
      } 
    )
    expect(
      JSON.stringify(contractFragmentsFiltered)
    ).to.eq(
      JSON.stringify(interfaceContract.interface.fragments)
    )
  })

  it('sets deployer wallet as the contract owner', async () => {
    const {configuration, ownerWallet} = await loadFixture(routerFixture)

    const owner = await configuration.owner()
    expect(owner).to.equal(ownerWallet.address)
  })

  it('can receive ETH, which is required for ETH transfers and swapping', async () => {
    const {router, otherWallet} = await loadFixture(routerFixture)

    await expect(
      await otherWallet.sendTransaction({ to: router.address, value: 1000, gasPrice: 0 })
    ).to.changeEtherBalance(router, 1000)
  })

  it('fails if the sent ETH value is to low to forward eth to the receiver', async () => {
    const {router, ownerWallet, otherWallet} = await loadFixture(routerFixture)
    
    await expect(
      route({
        router,
        wallet: ownerWallet,
        path: [ETH],
        amounts: [1000, 1000],
        addresses: [otherWallet.address],
        plugins: [router.address],
        value: 999
      })
    ).to.be.revertedWith(
      'DePay: Insufficient ETH amount payed in!'
    )
  })

  it('allows owner to withdraw ETH that remained in the contract', async () => {
    const {router, ownerWallet, otherWallet} = await loadFixture(routerFixture)
    await otherWallet.sendTransaction({ to: router.address, value: 1000, gasPrice: 0 })
    
    await expect(
      await router.connect(ownerWallet).withdraw(ETH, 1000)
    ).to.changeEtherBalance(ownerWallet, 1000)
  })

  it('does not allow others to withdraw ETH that remained in the contract', async () => {
    const {router, ownerWallet, otherWallet} = await loadFixture(routerFixture)
    await otherWallet.sendTransaction({ to: router.address, value: 1000, gasPrice: 0 })
    
    await expect(
      router.connect(otherWallet).withdraw(ETH, 1000)
    ).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('allows owner to withdraw tokens that remained in the contract', async () => {
    const {router, ownerWallet, otherWallet, testTokenContract} = await loadFixture(testTokenFixture)
    await testTokenContract.transfer(router.address, 1000)

    await expect(() => 
      router.connect(ownerWallet).withdraw(testTokenContract.address, 1000)
    ).to.changeTokenBalance(testTokenContract, ownerWallet, 1000)
  })

  it('does not allow others to withdraw tokens that remained in the contract', async () => {
    const {router, ownerWallet, otherWallet, testTokenContract} = await loadFixture(testTokenFixture)

    await expect(
      router.connect(otherWallet).withdraw(testTokenContract.address, 1000)
    ).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })
})
