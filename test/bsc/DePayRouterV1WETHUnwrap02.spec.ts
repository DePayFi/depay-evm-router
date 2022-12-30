import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import impersonate from '../helpers/impersonate'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { findByName } from 'depay-web3-exchanges'
import { Token } from 'depay-web3-tokens'

const blockchain = 'bsc'

describe(`DePayRouterV1WETHUnwrap02 on ${blockchain}`, function() {

  let WETH = CONSTANTS[blockchain].WRAPPED
  let addressWithWETH = '0xf977814e90da44bfa03b6295a0616a897441acec'

  let wallets,
      configuration,
      router,
      unwrapPlugin,
      paymentPlugin

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('deploys the plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1WETHUnwrap02')
    unwrapPlugin = await Plugin.deploy(CONSTANTS[blockchain].WRAPPED)
    await unwrapPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(unwrapPlugin.address)
  })

  it('can be combined with the payment plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    paymentPlugin = await Plugin.deploy()
    await paymentPlugin.deployed()
    await configuration.connect(wallets[0]).approvePlugin(paymentPlugin.address)
  })

  it('unwraps WETH to ETH and performs payment with WETH', async () => {
    let amount = ethers.utils.parseUnits('0.1', 18);
    const signer = await impersonate(addressWithWETH);
    let WETHToken = await ethers.getContractAt(Token[blockchain].DEFAULT, WETH)
    await WETHToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    await expect(() => 
      router.connect(signer).route(
        [CONSTANTS[blockchain].WRAPPED, CONSTANTS[blockchain].NATIVE], // path
        [amount, amount], // amounts
        [addressWithWETH, wallets[1].address], // addresses
        [unwrapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.changeEtherBalance(wallets[1], amount)
  })

})
