import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import impersonate from '../helpers/impersonate'
import IPancakeRouter02 from '../../artifacts/contracts/interfaces/IPancakeRouter02.sol/IPancakeRouter02.json'
import now from '../helpers/now'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Token } from 'depay-web3-tokens'

const CONSTANTS = require('depay-web3-constants').CONSTANTS
const findByName = require('depay-web3-exchanges').findByName

describe('DePayRouterV1PancakeSwap01 on BSC', function() {

  let exchange = findByName('pancakeswap')

  let BUSD = '0xe9e7cea3dedca5984780bafc599bd69add087d56'
  let CAKE = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'

  let ownerWallet,
      otherWallet,
      configuration,
      router,
      swapPlugin,
      paymentPlugin

  beforeEach(async ()=>{
    [ownerWallet, otherWallet] = await ethers.getSigners()
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('deploys the plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1PancakeSwap01')
    swapPlugin = await Plugin.deploy(CONSTANTS.bsc.WRAPPED, exchange.contracts.router.address)
    await swapPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(ownerWallet).approvePlugin(swapPlugin.address)
  })

  it('can be combined with the payment plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    paymentPlugin = await Plugin.deploy()
    await paymentPlugin.deployed()
    await configuration.connect(ownerWallet).approvePlugin(paymentPlugin.address)
  })

  it('swaps BNB to BUSD and performs payment in BUSD', async () => {
    let amountIn = 1000
    let PancakeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await PancakeRouter.getAmountsOut(amountIn, [CONSTANTS.bsc.WRAPPED, BUSD])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token.bsc.BEP20, BUSD)
    await expect(() => 
      router.connect(ownerWallet).route(
        [CONSTANTS.bsc.NATIVE, BUSD], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [ownerWallet.address, otherWallet.address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [], // data
        { value: 1000 }
      )
    ).to.changeTokenBalance(BUSDToken, otherWallet, amountOutMin)
  })

  it('swaps BUSD to ETH and performs payment with ETH', async () => {
    let amountIn = 1000
    let PancakeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await PancakeRouter.getAmountsOut(amountIn, [BUSD, CONSTANTS.bsc.WRAPPED])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token.bsc.BEP20, BUSD)
    const addressWithBUSD = '0x7Cc3964F0eBc218b6fFb374f9Dad7464e2Cb81C8'
    const signer = await impersonate(addressWithBUSD)
    await BUSDToken.connect(signer).approve(router.address, CONSTANTS.bsc.MAXINT)
    let allowance = await BUSDToken.connect(signer).allowance(addressWithBUSD, router.address)
    await expect(() => 
      router.connect(signer).route(
        [BUSD, CONSTANTS.bsc.NATIVE], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [addressWithBUSD, otherWallet.address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.changeEtherBalance(otherWallet, amountOutMin)
  })

  it('swaps BUSD to CAKE and performs payment with CAKE', async () => {
    let amountIn = 1000
    let PancakeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await PancakeRouter.getAmountsOut(amountIn, [BUSD, CONSTANTS.bsc.WRAPPED, CAKE])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token.bsc.BEP20, BUSD)
    let CAKEToken = await ethers.getContractAt(Token.bsc.BEP20, CAKE)
    const addressWithBUSD = '0x7Cc3964F0eBc218b6fFb374f9Dad7464e2Cb81C8'
    const signer = await impersonate(addressWithBUSD)
    await BUSDToken.connect(signer).approve(router.address, CONSTANTS.bsc.MAXINT)
    let allowance = await BUSDToken.connect(signer).allowance(addressWithBUSD, router.address)
    await expect(() => 
      router.connect(signer).route(
        [BUSD, CONSTANTS.bsc.NATIVE, CAKE], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [addressWithBUSD, otherWallet.address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.changeTokenBalance(CAKEToken, otherWallet, amountOutMin)
  })
})
