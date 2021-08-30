import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import impersonate from '../helpers/impersonate'
import IPancakeRouter02 from '../../artifacts/contracts/interfaces/IPancakeRouter02.sol/IPancakeRouter02.json'
import now from '../helpers/now'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { findByName } from 'depay-web3-exchanges'
import { Token } from 'depay-web3-tokens'

const blockchain = 'bsc'

describe(`DePayRouterV1SalesEvent01 on ${blockchain}`, function() {

  let wallets,
      configuration,
      router,
      paymentPlugin,
      swapPlugin,
      saleEventPlugin

  let exchange = findByName('pancakeswap')
  let BUSD = '0xe9e7cea3dedca5984780bafc599bd69add087d56'
  let addressWithBUSD = '0x7Cc3964F0eBc218b6fFb374f9Dad7464e2Cb81C8'
  let CAKE = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('deploys the plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1SaleEvent01')
    saleEventPlugin = await Plugin.deploy()
    await saleEventPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(saleEventPlugin.address)
  })

  it('requires a swap plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Uniswap01')
    swapPlugin = await Plugin.deploy(CONSTANTS[blockchain].WRAPPED, exchange.contracts.router.address)
    await swapPlugin.deployed()
    await configuration.connect(wallets[0]).approvePlugin(swapPlugin.address)
  })

  it('requires the payment plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    paymentPlugin = await Plugin.deploy()
    await paymentPlugin.deployed()
    await configuration.connect(wallets[0]).approvePlugin(paymentPlugin.address)
  })

  it('emits a Sale event if requested via plugin', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18)
    let exchangeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [BUSD, CONSTANTS[blockchain].WRAPPED, CAKE])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, BUSD)
    let CAKEToken = await ethers.getContractAt(Token[blockchain].DEFAULT, CAKE)
    const signer = await impersonate(addressWithBUSD)
    await BUSDToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    let allowance = await BUSDToken.connect(signer).allowance(addressWithBUSD, router.address)
    await expect(
      router.connect(signer).route(
        [BUSD, CONSTANTS[blockchain].NATIVE, CAKE], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [addressWithBUSD, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address, saleEventPlugin.address], // plugins
        [] // data
      )
    ).to.emit(saleEventPlugin, 'Sale')
    .withArgs(
      addressWithBUSD
    )
  })
})
