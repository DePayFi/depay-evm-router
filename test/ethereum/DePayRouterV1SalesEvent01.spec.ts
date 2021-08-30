import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import impersonate from '../helpers/impersonate'
import IUniswapV2Router02 from '../../artifacts/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json'
import now from '../helpers/now'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { findByName } from 'depay-web3-exchanges'
import { Token } from 'depay-web3-tokens'

const blockchain = 'ethereum'

describe(`DePayRouterV1SalesEvent01 on ${blockchain}`, function() {

  let wallets,
      configuration,
      router,
      paymentPlugin,
      swapPlugin,
      saleEventPlugin

  let exchange = findByName('uniswap_v2')
  let DAI = '0x6b175474e89094c44da98b954eedeac495271d0f'
  let addressWithDAI = '0x82810e81CAD10B8032D39758C8DBa3bA47Ad7092'
  let DEPAY = '0xa0bEd124a09ac2Bd941b10349d8d224fe3c955eb'

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
    let amountIn = ethers.utils.parseUnits('1000', 18);
    let exchangeRouter = await ethers.getContractAt(IUniswapV2Router02.abi, exchange.contracts.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [DAI, CONSTANTS[blockchain].WRAPPED, DEPAY])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let DAIToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DAI)
    let DEPAYToken = await ethers.getContractAt(Token[blockchain].DEFAULT, DEPAY)
    const signer = await impersonate(addressWithDAI)
    await DAIToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    let allowance = await DAIToken.connect(signer).allowance(addressWithDAI, router.address)
    await expect(
      router.connect(signer).route(
        [DAI, CONSTANTS[blockchain].NATIVE, DEPAY], // path
        [amountIn, amountOutMin, now()+60000], // amounts
        [addressWithDAI, addressWithDAI], // addresses
        [swapPlugin.address, paymentPlugin.address, saleEventPlugin.address], // plugins
        [] // data
      )
    ).to.emit(saleEventPlugin, 'Sale')
    .withArgs(
      addressWithDAI
    )
  })
})
