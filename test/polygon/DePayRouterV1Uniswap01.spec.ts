import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import impersonate from '../helpers/impersonate'
import IUniswapV2Router02 from '../../artifacts/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json'
import now from '../helpers/now'
import { CONSTANTS } from '@depay/web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { find } from '@depay/web3-exchanges-evm'
import { Token } from '@depay/web3-tokens-evm'

const blockchain = 'polygon'

describe(`DePayRouterV1Uniswap01 on ${blockchain}`, function() {

  let exchange = find(blockchain, 'quickswap')
  let DAI = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  let addressWithDAI = '0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245'
  let SAND = '0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683'

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
    const Plugin = await ethers.getContractFactory('DePayRouterV1Uniswap01')
    swapPlugin = await Plugin.deploy(CONSTANTS[blockchain].WRAPPED, exchange.router.address)
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
    let amountIn = ethers.utils.parseUnits('1000', 18);
    let exchangeRouter = await ethers.getContractAt(IUniswapV2Router02.abi, exchange.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [CONSTANTS[blockchain].WRAPPED, DAI])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let DAIToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DAI)
    await expect(() => 
      router.connect(wallets[0]).route(
        [CONSTANTS[blockchain].NATIVE, DAI], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [wallets[0].address, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [], // data
        { value: amountIn }
      )
    ).to.changeTokenBalance(DAIToken, wallets[1], amountOutMin)
  })

  it('swaps DAI to ETH and performs payment with ETH', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18);
    let exchangeRouter = await ethers.getContractAt(IUniswapV2Router02.abi, exchange.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [DAI, CONSTANTS[blockchain].WRAPPED])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let DAIToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DAI)
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

  it('swaps DAI to SAND and performs payment with SAND', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18);
    let exchangeRouter = await ethers.getContractAt(IUniswapV2Router02.abi, exchange.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [DAI, CONSTANTS[blockchain].WRAPPED, SAND])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let DAIToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DAI)
    let SANDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, SAND)
    const signer = await impersonate(addressWithDAI)
    await DAIToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    let allowance = await DAIToken.connect(signer).allowance(addressWithDAI, router.address)
    await expect(() => 
      router.connect(signer).route(
        [DAI, CONSTANTS[blockchain].NATIVE, SAND], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [addressWithDAI, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.changeTokenBalance(SANDToken, wallets[1], amountOutMin)
  })

  it('fails when a miner withholds a swap and executes the payment transaction after the deadline has been reached', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18);
    let exchangeRouter = await ethers.getContractAt(IUniswapV2Router02.abi, exchange.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [DAI, CONSTANTS[blockchain].WRAPPED, SAND])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let DAIToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DAI)
    let SANDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, SAND)
    const signer = await impersonate(addressWithDAI)
    await DAIToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    let allowance = await DAIToken.connect(signer).allowance(addressWithDAI, router.address)
    await expect(
      router.connect(signer).route(
        [DAI, CONSTANTS[blockchain].NATIVE, SAND], // path
        [amountIn, amountOutMin, now()-60000], // amounts
        [addressWithDAI, wallets[1].address], // addresses
        [swapPlugin.address, paymentPlugin.address], // plugins
        [] // data
      )
    ).to.be.revertedWith(
      'UniswapV2Router: EXPIRED'
    )
  })
})
