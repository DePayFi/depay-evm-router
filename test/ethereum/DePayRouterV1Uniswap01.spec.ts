import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import impersonate from '../helpers/impersonate'
import IUniswapV2Router02 from '../../artifacts/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json'
import now from '../helpers/now'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Token } from 'depay-web3-tokens'

const CONSTANTS = require('depay-web3-constants').CONSTANTS
const findByName = require('depay-web3-exchanges').findByName
const blockchain = 'ethereum'

describe(`DePayRouterV1Uniswap01 on ${blockchain}`, function() {

  let exchange = findByName('uniswap_v2')

  let DAI = '0x6b175474e89094c44da98b954eedeac495271d0f'
  let DEPAY = '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'

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

  it('swaps NATIVE to DAI and performs payment in DAI', async () => {
    let amountIn = 1000
    let PancakeRouter = await ethers.getContractAt(IUniswapV2Router02.abi, exchange.contracts.router.address)
    let amountsOut = await PancakeRouter.getAmountsOut(amountIn, [CONSTANTS[blockchain].WRAPPED, DAI])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let DAIToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DAI)
    await expect(() => 
      router.connect(wallets[0]).route(
        [CONSTANTS[blockchain].NATIVE, DAI], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [wallets[0].address, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [], // data
        { value: 1000 }
      )
    ).to.changeTokenBalance(DAIToken, wallets[1], amountOutMin)
  })

  it('swaps DAI to ETH and performs payment with ETH', async () => {
    let amountIn = 1000
    let PancakeRouter = await ethers.getContractAt(IUniswapV2Router02.abi, exchange.contracts.router.address)
    let amountsOut = await PancakeRouter.getAmountsOut(amountIn, [DAI, CONSTANTS[blockchain].WRAPPED])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let DAIToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DAI)
    const addressWithDAI = '0x7Cc3964F0eBc218b6fFb374f9Dad7464e2Cb81C8'
    const signer = await impersonate(addressWithDAI)
    await DAIToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    let allowance = await DAIToken.connect(signer).allowance(addressWithDAI, router.address)
    await expect(() => 
      router.connect(signer).route(
        [DAI, CONSTANTS[blockchain].NATIVE], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [addressWithDAI, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.changeEtherBalance(wallets[1], amountOutMin)
  })

  it('swaps DAI to DEPAY and performs payment with DEPAY', async () => {
    let amountIn = 1000
    let PancakeRouter = await ethers.getContractAt(IUniswapV2Router02.abi, exchange.contracts.router.address)
    let amountsOut = await PancakeRouter.getAmountsOut(amountIn, [DAI, CONSTANTS[blockchain].WRAPPED, DEPAY])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let DAIToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DAI)
    let DEPAYToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DEPAY)
    const addressWithDAI = '0x7Cc3964F0eBc218b6fFb374f9Dad7464e2Cb81C8'
    const signer = await impersonate(addressWithDAI)
    await DAIToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    let allowance = await DAIToken.connect(signer).allowance(addressWithDAI, router.address)
    await expect(() => 
      router.connect(signer).route(
        [DAI, CONSTANTS[blockchain].NATIVE, DEPAY], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [addressWithDAI, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.changeTokenBalance(DEPAYToken, wallets[1], amountOutMin)
  })

  it('makes sure that the token balance in the smart contract is >= after the payment compared to before', async () => {
    // throw "PENDING"
  })

  it('makes sure that the eth balance in the smart contract is >= after the payment compared to before', async () => {
    // throw "PENDING"
  })

  it('fails when a miner withholds a swap and executes the payment transaction after the deadline has been reached', async () => {
    // throw "PENDING"
  })
})
