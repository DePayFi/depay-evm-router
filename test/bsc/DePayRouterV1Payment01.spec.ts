import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import deployTestToken from '../helpers/deploy/testToken'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'

const blockchain = 'bsc'

describe(`DePayRouterV1Payment01 on ${blockchain}`, function() {

  let wallets,
      configuration,
      router,
      paymentPlugin

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('deploys the plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    paymentPlugin = await Plugin.deploy()
    await paymentPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(paymentPlugin.address)
  })

  it('allows for direct token transfers without performing any conversion', async () => {
    let testToken = await deployTestToken()
    let amount = ethers.utils.parseUnits('1000', 18)
    await testToken.connect(wallets[0]).approve(router.address, amount)

    await expect(() => 
      router.connect(wallets[0]).route(
        [testToken.address], // path
        [amount, amount], // amounts
        [wallets[1].address], // addresses
        [paymentPlugin.address], // plugins
        [] // data
      )
    ).to.changeTokenBalance(testToken, wallets[1], amount)
  })

  it('allows for direct NATIVE currency transfers without performing any conversion', async () => {
    let amount = ethers.utils.parseUnits('1000', 18)

    await expect(() => 
      router.connect(wallets[0]).route(
        [CONSTANTS[blockchain].NATIVE], // path
        [amount, amount], // amounts
        [wallets[1].address], // addresses
        [paymentPlugin.address], // plugins
        [], // data
        { value: amount }
      )
    ).to.changeEtherBalance(wallets[1], amount)
  })

})
