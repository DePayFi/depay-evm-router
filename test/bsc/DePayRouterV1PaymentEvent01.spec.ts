import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'

const blockchain = 'bsc'

describe(`DePayRouterV1PaymentEvent01 on ${blockchain}`, function() {

  let wallets,
      configuration,
      router,
      paymentEventPlugin

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('deploys the plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1PaymentEvent01')
    paymentEventPlugin = await Plugin.deploy()
    await paymentEventPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(paymentEventPlugin.address)
  })

  it('emits a Payment event if requested via plugin', async () => {
    let amount = ethers.utils.parseUnits('1000', 18)

    await expect(
      router.connect(wallets[0]).route(
        [CONSTANTS[blockchain].NATIVE], // path
        [amount, amount], // amounts
        [wallets[0].address, wallets[1].address], // addresses
        [paymentEventPlugin.address], // plugins
        [], // data
        { value: amount }
      )
    ).to.emit(paymentEventPlugin, 'Payment')
    .withArgs(
      wallets[0].address,
      wallets[1].address
    )
  })
})
