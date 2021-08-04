import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import deployTestToken from '../helpers/deploy/testToken'
import { ethers } from 'hardhat'
import { expect } from 'chai'

const CONSTANTS = require('depay-web3-constants').CONSTANTS

describe('DePayRouterV1 on BSC', () => {

  let ownerWallet,
      otherWallet,
      configuration,
      router

  beforeEach(async ()=>{
    [ownerWallet, otherWallet] = await ethers.getSigners()
  })

  it('deploys router successfully', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('sets the deployer wallet as the contract owner', async () => {
    const owner = await configuration.owner()
    expect(owner).to.equal(ownerWallet.address)
  })

  it('can receive ETH, which is required for ETH transfers and swapping', async () => {
    await expect(
      await otherWallet.sendTransaction({ to: router.address, value: 1000, gasPrice: 0 })
    ).to.changeEtherBalance(router, 1000)
  })

  it('fails if the sent NATIVE token value is to low to forward it to the receiver', async () => {
    await expect(
      router.connect(ownerWallet).route(
        [CONSTANTS.bsc.NATIVE], // path
        [1000], // amounts
        [], // addresses
        [], // plugins
        [], // data
        { value: 999 }
      )
    ).to.be.revertedWith(
      'DePay: Insufficient amount payed in!'
    )
  })

  it('allows owner to withdraw NATIVE token that remained in the contract', async () => {
    await otherWallet.sendTransaction({ to: router.address, value: 1000, gasPrice: 0 })

    await expect(
      await router.connect(ownerWallet).withdraw(CONSTANTS.bsc.NATIVE, 1000)
    ).to.changeEtherBalance(ownerWallet, 1000)
  })

  it('does not allow others to withdraw NATIVE tokens that remained in the contract', async () => {
    await otherWallet.sendTransaction({ to: router.address, value: 1000, gasPrice: 0 })

    await expect(
      router.connect(otherWallet).withdraw(CONSTANTS.bsc.NATIVE, 1000)
    ).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('allows owner to withdraw tokens that remained in the contract', async () => {
    let testToken = await deployTestToken()
    await testToken.transfer(router.address, 1000)

    await expect(() => 
      router.connect(ownerWallet).withdraw(testToken.address, 1000)
    ).to.changeTokenBalance(testToken, ownerWallet, 1000)
  })

  it('does not allow others to withdraw tokens that remained in the contract', async () => {
    let testToken = await deployTestToken()
    await testToken.transfer(router.address, 1000)

    await expect(
      router.connect(otherWallet).withdraw(testToken.address, 1000)
    ).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('tells you if a plugin has been approved or not', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    let plugin = await Plugin.deploy()
    await plugin.deployed()
    await configuration.connect(ownerWallet).approvePlugin(plugin.address)
    expect(await router.isApproved(plugin.address)).to.eq(true)
    expect(await router.isApproved(otherWallet.address)).to.eq(false)
  })

  it('fails when trying to use a plugin that is not approved', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    let plugin = await Plugin.deploy()
    await plugin.deployed()
    expect(await router.isApproved(plugin.address)).to.eq(false)

    await expect(
      router.connect(ownerWallet).route(
        [CONSTANTS.bsc.NATIVE], // path
        [1000], // amounts
        [], // addresses
        [plugin.address], // plugins
        [], // data
        { value: 1000 }
      )
    ).to.be.revertedWith(
      'DePay: Plugin not approved!'
    )
  })
})
