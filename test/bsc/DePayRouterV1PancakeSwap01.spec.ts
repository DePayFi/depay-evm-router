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

describe(`DePayRouterV1PancakeSwap01 on ${blockchain}`, function() {

  let exchange = findByName('pancakeswap')
  let BUSD = '0xe9e7cea3dedca5984780bafc599bd69add087d56'
  let addressWithBUSD = '0x7Cc3964F0eBc218b6fFb374f9Dad7464e2Cb81C8'
  let CAKE = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'

  let wallets,
      configuration,
      router,
      swapPlugin,
      paymentPlugin

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('deploys the plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1PancakeSwap01')
    swapPlugin = await Plugin.deploy(CONSTANTS[blockchain].WRAPPED, exchange.contracts.router.address)
    await swapPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(swapPlugin.address)
  })

  it('can be combined with the payment plugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Payment01')
    paymentPlugin = await Plugin.deploy()
    await paymentPlugin.deployed()
    await configuration.connect(wallets[0]).approvePlugin(paymentPlugin.address)
  })

  it('swaps NATIVE to BUSD and performs payment in BUSD', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18)
    let exchangeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [CONSTANTS[blockchain].WRAPPED, BUSD])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, BUSD)
    await expect(() => 
      router.connect(wallets[0]).route(
        [CONSTANTS[blockchain].NATIVE, BUSD], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [wallets[0].address, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [], // data
        { value: amountIn }
      )
    ).to.changeTokenBalance(BUSDToken, wallets[1], amountOutMin)
  })

  it('swaps BUSD to NATIVE and performs payment with NATIVE', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18)
    let exchangeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [BUSD, CONSTANTS[blockchain].WRAPPED])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, BUSD)
    const signer = await impersonate(addressWithBUSD)
    await BUSDToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    let allowance = await BUSDToken.connect(signer).allowance(addressWithBUSD, router.address)
    await expect(() => 
      router.connect(signer).route(
        [BUSD, CONSTANTS[blockchain].NATIVE], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [addressWithBUSD, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.changeEtherBalance(wallets[1], amountOutMin)
  })

  it('swaps BUSD to CAKE and performs payment with CAKE', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18)
    let exchangeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [BUSD, CONSTANTS[blockchain].WRAPPED, CAKE])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, BUSD)
    let CAKEToken = await ethers.getContractAt(Token[blockchain].DEFAULT, CAKE)
    const signer = await impersonate(addressWithBUSD)
    await BUSDToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    let allowance = await BUSDToken.connect(signer).allowance(addressWithBUSD, router.address)
    await expect(() => 
      router.connect(signer).route(
        [BUSD, CONSTANTS[blockchain].NATIVE, CAKE], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [addressWithBUSD, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.changeTokenBalance(CAKEToken, wallets[1], amountOutMin)
  })

  it('fails when a miner withholds a swap and executes the payment transaction after the deadline has been reached', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18);
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
        [amountIn, amountOutMin, now()-60000], // amounts
        [addressWithBUSD, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.be.revertedWith(
      'PancakeRouter: EXPIRED'
    )
  })
})
