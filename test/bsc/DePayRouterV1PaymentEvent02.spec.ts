import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import deployTestToken from '../helpers/deploy/testToken'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'

const blockchain = 'bsc'

describe(`DePayRouterV1PaymentEvent02 on ${blockchain}`, function() {

  let wallets,
      configuration,
      router,
      paymentPlugin,
      paymentEventPlugin

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('requires the paymentPlugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    paymentPlugin = await Plugin.deploy()
    await paymentPlugin.deployed()
    await configuration.connect(wallets[0]).approvePlugin(paymentPlugin.address)
  })

  it('deploys the plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1PaymentEvent02')
    paymentEventPlugin = await Plugin.deploy(router.address)
    await paymentEventPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(paymentEventPlugin.address)
  })

  it('emits a payment event', async () => {
    let testToken = await deployTestToken()
    let amount = ethers.utils.parseUnits('1000', 18)
    await testToken.connect(wallets[0]).approve(router.address, amount)

    await expect(
      router.connect(wallets[0]).route(
        [testToken.address], // path
        [amount, amount], // amounts
        [wallets[0].address, wallets[1].address], // addresses
        [paymentEventPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.emit(paymentEventPlugin, 'Payment')
    .withArgs(
      wallets[0].address,
      wallets[1].address,
      amount,
      testToken.address
    );
  })

  describe('called from another address but router', async () => {

    it('fails if not called from the original depay router', async () => {
      let testToken = await deployTestToken()
      let amount = ethers.utils.parseUnits('1000', 18)
      await testToken.connect(wallets[0]).approve(router.address, amount)

      await expect(
        paymentEventPlugin.connect(wallets[0]).execute(
          [testToken.address], // path
          [amount, amount], // amounts
          [wallets[0].address, wallets[1].address], // addresses
          [paymentEventPlugin.address, paymentPlugin.address], // plugins
          [] // data
        )
      ).to.be.revertedWith('Only the DePayRouterV1 can call this plugin!')
    })
  })
})
