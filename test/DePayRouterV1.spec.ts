import chai, { expect } from 'chai'

import { 
  solidity,
  deployMockContract,
  loadFixture,
} from 'ethereum-waffle'

import {
  paymentAndTestTokenFixture,
  paymentEventFixture,
  paymentFixture,
  routerFixture,
  testTokenFixture,
  unapprovedUniswapFixture,
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
      'VM Exception while processing transaction: revert DePay: Insufficient ETH amount payed in!'
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
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
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
      'VM Exception while processing transaction: revert Ownable: caller is not the owner'
    )
  })
})
