import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import deployTestToken from '../helpers/deploy/testToken'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'

const blockchain = 'bsc'

describe(`DePayRouterV1PaymentFee01 on ${blockchain}`, function() {

  let wallets,
      configuration,
      router,
      paymentPlugin,
      paymentFeePlugin

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
    const Plugin = await ethers.getContractFactory('DePayRouterV1PaymentFee01')
    paymentFeePlugin = await Plugin.deploy()
    await paymentFeePlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(paymentFeePlugin.address)
  })

  it('splits the payment for a received token and sends a fee to a third party', async () => {
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
            [paymentFeePlugin.address, paymentPlugin.address], // plugins
            [] // data
          )
        ).to.changeTokenBalance(testToken, paymentReceiver, ethers.utils.parseUnits('1000', 18))
      ).to.changeTokenBalance(testToken, thirdPartyFeeReceiver, ethers.utils.parseUnits('30', 18))
    ).to.changeTokenBalance(testToken, sender, ethers.utils.parseUnits('-1030', 18))
  })

  it('splits the payment for received NATIVE currency and sends a fee to a third party', async () => {
    let payedAmount = ethers.utils.parseUnits('1.1', 18)
    let fee = ethers.utils.parseUnits('0.3', 18)
    let totalAmount = ethers.utils.parseUnits('1.4', 18)
    let sender = wallets[0]
    let paymentReceiver = wallets[1]
    let thirdPartyFeeReceiver = wallets[2]

    let transaction = await router.connect(sender).route(
      [CONSTANTS[blockchain].NATIVE], // path
      [totalAmount, payedAmount, 0, 0, fee], // amounts
      [sender.address, thirdPartyFeeReceiver.address, paymentReceiver.address], // addresses
      [paymentFeePlugin.address, paymentPlugin.address], // plugins
      [], // data
      { value: totalAmount }
    )
    
    expect(transaction).to.changeEtherBalance(paymentReceiver, ethers.utils.parseUnits('1.1', 18))
    expect(transaction).to.changeEtherBalance(thirdPartyFeeReceiver, ethers.utils.parseUnits('0.3', 18))
    expect(transaction).to.changeEtherBalance(sender, ethers.utils.parseUnits('-1.4', 18))
  })

  it('fails and reverts if fee+payment is higher than amount payed in for NATIVE currency', async () => {
    let payedAmount = ethers.utils.parseUnits('1.1', 18)
    let fee = ethers.utils.parseUnits('0.3', 18)
    let totalAmount = ethers.utils.parseUnits('1.4', 18)
    let sender = wallets[0]
    let paymentReceiver = wallets[1]
    let thirdPartyFeeReceiver = wallets[2]
    let amountPaidIn = totalAmount.sub(ethers.utils.parseUnits('0.1', 18))
    await wallets[3].sendTransaction({ to: router.address, value: ethers.utils.parseUnits('0.1', 18) })

    await expect(
      router.connect(sender).route(
        [CONSTANTS[blockchain].NATIVE], // path
        [amountPaidIn, payedAmount, 0, 0, fee], // amounts
        [sender.address, thirdPartyFeeReceiver.address, paymentReceiver.address], // addresses
        [paymentFeePlugin.address, paymentPlugin.address], // plugins
        [], // data
        { value: amountPaidIn }
      )
    ).to.be.revertedWith(
      'DePay: Insufficient balance after payment!'
    )
  })

  it('fails and reverts if fee+payment is higher than amount payed in for token', async () => {
    let testToken = await deployTestToken()
    let payedAmount = ethers.utils.parseUnits('1000', 18)
    let fee = ethers.utils.parseUnits('30', 18)
    let totalAmount = ethers.utils.parseUnits('1030', 18)
    let amountPaidIn = totalAmount.sub(ethers.utils.parseUnits('10', 18))
    let sender = wallets[0]
    let paymentReceiver = wallets[1]
    let thirdPartyFeeReceiver = wallets[2]
    await testToken.connect(sender).approve(router.address, CONSTANTS[blockchain].MAXINT)
    await testToken.connect(sender).transfer(router.address, ethers.utils.parseUnits('10', 18))

    await expect(
      router.connect(sender).route(
        [testToken.address], // path
        [amountPaidIn, payedAmount, 0, 0, fee], // amounts
        [sender.address, thirdPartyFeeReceiver.address, paymentReceiver.address], // addresses
        [paymentFeePlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.be.revertedWith(
      'DePay: Insufficient balance after payment!'
    )
  })
})
