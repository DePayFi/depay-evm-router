import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import impersonate from '../helpers/impersonate'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { findByName } from 'depay-web3-exchanges'
import { Token } from 'depay-web3-tokens'

const blockchain = 'bsc'

describe(`DePayRouterV1WETHWrap01 on ${blockchain}`, function() {

  let WETH = CONSTANTS[blockchain].WRAPPED
  let addressWithETH = '0xe2fc31F816A9b94326492132018C3aEcC4a93aE1'

  let wallets,
      configuration,
      router,
      wrapPlugin,
      paymentPlugin

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('deploys the plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1WETHWrap01')
    wrapPlugin = await Plugin.deploy(CONSTANTS[blockchain].WRAPPED)
    await wrapPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(wrapPlugin.address)
  })

  it('can be combined with the payment plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    paymentPlugin = await Plugin.deploy()
    await paymentPlugin.deployed()
    await configuration.connect(wallets[0]).approvePlugin(paymentPlugin.address)
  })

  it('wraps ETH to WETH and performs payment with WETH', async () => {
    let amount = ethers.utils.parseUnits('0.1', 18);
    const signer = await impersonate(addressWithETH);
    let WETHToken = await ethers.getContractAt(Token[blockchain].DEFAULT, WETH);
    await expect(() => 
      router.connect(signer).route(
        [CONSTANTS[blockchain].NATIVE, CONSTANTS[blockchain].WRAPPED], // path
        [amount, amount], // amounts
        [addressWithETH, wallets[1].address], // addresses
        [wrapPlugin.address, paymentPlugin.address], // plugins
        [], // data
        { value: amount }
      )
    ).to.changeTokenBalance(WETHToken, wallets[1], amount)
  })

})
