import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import deployTestToken from '../helpers/deploy/testToken'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'

const blockchain = 'ethereum'

describe(`DePayRouterV1PaymentFeeWithEvent01 on ${blockchain}`, function() {

  let wallets,
      configuration,
      router,
      paymentPlugin,
      paymentFeeEventPlugin,
      paymentFeeWithEventPlugin

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

  it('requires the fee event plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1PaymentFeeEvent01')
    paymentFeeEventPlugin = await Plugin.deploy(router.address)
    await paymentFeeEventPlugin.deployed()
  })

  it('is supposed to keep the paymentFeeEventPlugin itself unapproved', async () => {
    // as its only allowed to call it as part of PaymentWithEvent not standalone
    let approved = await configuration.approvedPlugins(paymentFeeEventPlugin.address)
    expect(approved).to.eq('0x0000000000000000000000000000000000000000')
  })

  it('deploys the paymentFeeWithEventPlugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1PaymentFeeWithEvent01')
    paymentFeeWithEventPlugin = await Plugin.deploy(router.address, paymentFeeEventPlugin.address)
    await paymentFeeWithEventPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(paymentFeeWithEventPlugin.address)
  })

  it('pays fees', async () => {
    let testToken = await deployTestToken()
    let payedAmount = ethers.utils.parseUnits('1000', 18)
    let fee = ethers.utils.parseUnits('30', 18)
    let totalAmount = ethers.utils.parseUnits('1030', 18)
    let sender = wallets[0]
    let paymentReceiver = wallets[1]
    let thirdPartyFeeReceiver = wallets[2]
    await testToken.connect(sender).approve(router.address, CONSTANTS[blockchain].MAXINT)

    await expect(()=>
      expect(()=>
        expect(()=>
          router.connect(sender).route(
            [testToken.address], // path
            [totalAmount, payedAmount, 0, 0, fee], // amounts
            [sender.address, thirdPartyFeeReceiver.address, paymentReceiver.address], // addresses
            [paymentFeeWithEventPlugin.address, paymentPlugin.address], // plugins
            [] // data
          )
        ).to.changeTokenBalance(testToken, paymentReceiver, ethers.utils.parseUnits('1000', 18))
      ).to.changeTokenBalance(testToken, thirdPartyFeeReceiver, ethers.utils.parseUnits('30', 18))
    ).to.changeTokenBalance(testToken, sender, ethers.utils.parseUnits('-1030', 18))
  })

  it('emits an event', async () => {
    let testToken = await deployTestToken()
    let payedAmount = ethers.utils.parseUnits('1000', 18)
    let fee = ethers.utils.parseUnits('30', 18)
    let totalAmount = ethers.utils.parseUnits('1030', 18)
    let sender = wallets[0]
    let paymentReceiver = wallets[1]
    let thirdPartyFeeReceiver = wallets[2]
    await testToken.connect(sender).approve(router.address, CONSTANTS[blockchain].MAXINT)

    await expect(
      router.connect(sender).route(
        [testToken.address], // path
        [totalAmount, payedAmount, 0, 0, fee], // amounts
        [sender.address, thirdPartyFeeReceiver.address, paymentReceiver.address], // addresses
        [paymentFeeWithEventPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.emit(paymentFeeEventPlugin, 'Fee')
    .withArgs(
      wallets[0].address,
      thirdPartyFeeReceiver.address,
      fee,
      testToken.address
    );
  })

  describe('trying to call event plugin directly from another address but the router', async () => {

    it('fails if not called from the original depay router', async () => {
      let testToken = await deployTestToken()
      let payedAmount = ethers.utils.parseUnits('1000', 18)
      let fee = ethers.utils.parseUnits('30', 18)
      let totalAmount = ethers.utils.parseUnits('1030', 18)
      let sender = wallets[0]
      let paymentReceiver = wallets[1]
      let thirdPartyFeeReceiver = wallets[2]
      await testToken.connect(sender).approve(router.address, CONSTANTS[blockchain].MAXINT)

      await expect(
        paymentFeeWithEventPlugin.connect(wallets[0]).execute(
          [testToken.address], // path
          [totalAmount, payedAmount, 0, 0, fee], // amounts
          [sender.address, thirdPartyFeeReceiver.address, paymentReceiver.address], // addresses
          [paymentFeeWithEventPlugin.address, paymentPlugin.address], // plugins
          [] // data
        )
      ).to.be.revertedWith('Only the DePayRouterV1 can call this plugin!')
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
          [paymentFeeEventPlugin.address, paymentPlugin.address], // plugins
          [] // data
        )
      ).to.be.revertedWith('DePay: Plugin not approved!')
    })
  })
})
