import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import deployTestToken from '../helpers/deploy/testToken'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'

const blockchain = 'ethereum'

describe(`DePayRouterV1PaymentWithEvent01 on ${blockchain}`, function() {

  let wallets,
      configuration,
      router,
      paymentPlugin,
      paymentEventPlugin,
      paymentWithEventPlugin

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

  it('requires the paymentEventPlugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1PaymentEvent02')
    paymentEventPlugin = await Plugin.deploy(router.address)
    await paymentEventPlugin.deployed()
  })

  it('is supposed to keep the paymentEventPlugin itself unapproved', async () => {
    // as its only allowed to call it as part of PaymentWithEvent not standalone
    let approved = await configuration.approvedPlugins(paymentEventPlugin.address)
    expect(approved).to.eq('0x0000000000000000000000000000000000000000')
  })

  it('deploys the paymentWithEventPlugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1PaymentWithEvent01')
    paymentWithEventPlugin = await Plugin.deploy(router.address, paymentEventPlugin.address)
    await paymentWithEventPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(paymentWithEventPlugin.address)
  })

  it('awalys emits a payment event as part of the payment', async () => {
    let testToken = await deployTestToken()
    let amount = ethers.utils.parseUnits('1000', 18)
    await testToken.connect(wallets[0]).approve(router.address, amount)

    await expect(
      router.connect(wallets[0]).route(
        [testToken.address], // path
        [amount, amount], // amounts
        [wallets[0].address, wallets[1].address], // addresses
        [paymentWithEventPlugin.address], // plugins
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

  describe('trying to call event plugin directly from another address but the router', async () => {

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

  describe('trying to call event with payment plugin directly from another address but the router', async () => {

    it('fails if not called from the original depay router', async () => {
      let testToken = await deployTestToken()
      let amount = ethers.utils.parseUnits('1000', 18)
      await testToken.connect(wallets[0]).approve(router.address, amount)

      await expect(
        paymentWithEventPlugin.connect(wallets[0]).execute(
          [testToken.address], // path
          [amount, amount], // amounts
          [wallets[0].address, wallets[1].address], // addresses
          [paymentEventPlugin.address, paymentPlugin.address], // plugins
          [] // data
        )
      ).to.be.revertedWith('Only the DePayRouterV1 can call this plugin!')
    })
  })

  describe('trying to emit valid event without paying', async () => {

    it('fails if not called from the original depay router', async () => {
      let testToken = await deployTestToken()
      let amount = ethers.utils.parseUnits('1000', 18)
      await testToken.connect(wallets[0]).approve(router.address, amount)

      await expect(
        router.connect(wallets[0]).route(
          [testToken.address], // path
          [amount, amount], // amounts
          [wallets[0].address, wallets[1].address], // addresses
          [paymentWithEventPlugin.address], // plugins
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
  })

  describe('trying to call event plugin directly via the router', async () => {

    it('fails if tring to route with paymentEventPlugin directly', async () => {
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
      ).to.be.revertedWith('DePay: Plugin not approved!')
    })
  })
})
