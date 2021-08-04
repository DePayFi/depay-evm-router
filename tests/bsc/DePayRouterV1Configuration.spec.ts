import deployConfiguration from '../helpers/deploy/configuration'
import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('DePayRouterV1Configuration on BSC', () => {

  let ownerWallet,
      otherWallet,
      configuration,
      plugin

  beforeEach(async ()=>{
    [ownerWallet, otherWallet] = await ethers.getSigners()
  })

  it('is deployable', async () => {
    configuration = await deployConfiguration()
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    plugin = await Plugin.deploy()
    await plugin.deployed()
  })

  it('allows the owner to approve plugins and emits PluginApproved', async () => {
    await expect(
      configuration.connect(ownerWallet).approvePlugin(plugin.address)
    )
    .to.emit(configuration, 'PluginApproved')
    .withArgs(plugin.address)
  })

  it('does NOT allow others to add plugins', async () => {
    await expect(
      configuration.connect(otherWallet).approvePlugin(plugin.address)
    ).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('allows the contract owner to disapprove plugins and emits PluginDisapproved', async () => {
    await expect(
      configuration.connect(ownerWallet).approvePlugin(plugin.address)
    )
    .to.emit(configuration, 'PluginApproved')
    .withArgs(plugin.address)
  })

  it('does not allow others to disapprove plugins', async () => {
    await expect(
      configuration.connect(otherWallet).disapprovePlugin(plugin.address)
    ).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

})
