import deployConfiguration from '../helpers/deploy/configuration'
import deployRouter from '../helpers/deploy/router'
import deployTestToken from '../helpers/deploy/testToken'
import impersonate from '../helpers/impersonate'
import IPancakeRouter02 from '../../artifacts/contracts/interfaces/IPancakeRouter02.sol/IPancakeRouter02.json'
import now from '../helpers/now'
import { CONSTANTS } from 'depay-web3-constants'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { findByName } from 'depay-web3-exchanges'
import { Token } from 'depay-web3-tokens'

const blockchain = 'bsc'

describe(`DePayRouterV1ApproveAndCallContractAddressPassedAmountBoolean01 on ${blockchain}`, function() {

  let wallets,
      configuration,
      router,
      contractCallPlugin,
      swapPlugin,
      stakingContract

  let exchange = findByName('pancakeswap')
  let BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
  let addressWithBUSD = '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3'

  beforeEach(async ()=>{
    wallets = await ethers.getSigners()
  })

  it('requires the router', async () => {
    configuration = await deployConfiguration()
    router = await deployRouter(configuration.address)
  })

  it('deploys the contractCallPlugin', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1ApproveAndCallContractAddressPassedAmountBoolean01')
    contractCallPlugin = await Plugin.deploy()
    await contractCallPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(contractCallPlugin.address)
  })

  it('requires a smart contract it can pay into (like a staking pool)', async () => {
    const Plugin = await ethers.getContractFactory('TestStakingPool')
    stakingContract = await Plugin.deploy()
    await stakingContract.deployed()
  })

  it('requires a swap plugin to perform swap payments into smart contracts', async () => {
    const Plugin = await ethers.getContractFactory('DePayRouterV1Uniswap01')
    swapPlugin = await Plugin.deploy(CONSTANTS[blockchain].WRAPPED, exchange.contracts.router.address)
    await swapPlugin.deployed()
  })

  it('approves the plugin', async () => {
    await configuration.connect(wallets[0]).approvePlugin(swapPlugin.address)
  })

  it('swaps NATIVE to BUSD and performs payment into smart contract in BUSD', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18);
    let exchangeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [CONSTANTS[blockchain].WRAPPED, BUSD])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, BUSD)
    let passedAmount = ethers.BigNumber.from(amountOutMin).mul(2)
    await expect(
      router.connect(wallets[0]).route(
        [CONSTANTS[blockchain].NATIVE, BUSD], // path
        [amountIn, amountOutMin, now()+60000, 0, 0, passedAmount], // amounts
        [wallets[0].address, stakingContract.address], // addresses
        [swapPlugin.address, contractCallPlugin.address], // plugins
        ['stakeAddressProcessedAmountBooleanBUSD(address,uint256,bool)', 'true'], // data
        { value: amountIn }
      )
    ).to.emit(stakingContract, 'StakeAddressAmountBooleanToken')
    .withArgs(
      wallets[0].address,
      amountOutMin,
      true
    );
    let stakingContractBalance = await(BUSDToken.balanceOf(stakingContract.address))
    let allowance = await BUSDToken.allowance(router.address, stakingContract.address)
    expect(allowance.toString()).to.eq('0') // it makes sure to only allow what is required to do the payment
    expect(stakingContractBalance).to.equal(amountOutMin)
  })

  it('swaps BUSD to BNB and performs payment into smart contract with BNB', async () => {
    let amountIn = ethers.utils.parseUnits('1000', 18);
    let exchangeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [BUSD, CONSTANTS[blockchain].WRAPPED])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, BUSD)
    let passedAmount = ethers.BigNumber.from(amountOutMin).mul(2)
    const signer = await impersonate(addressWithBUSD)
    await BUSDToken.connect(signer).approve(router.address, CONSTANTS[blockchain].MAXINT)
    await expect(
      router.connect(signer).route(
        [BUSD, CONSTANTS[blockchain].NATIVE], // path
        [amountIn, amountOutMin, now()+60000, 0, 0, passedAmount], // amounts
        [addressWithBUSD, stakingContract.address], // addresses
        [swapPlugin.address, contractCallPlugin.address], // plugins
        ['stakeAddressProcessedAmountBooleanNative(address,uint256,bool)', 'true'] // data
      )
    ).to.emit(stakingContract, 'StakeAddressAmountBooleanNative')
    .withArgs(
      addressWithBUSD,
      amountOutMin,
      true
    )
    expect(await ethers.provider.getBalance(stakingContract.address)).to.equal(amountOutMin)
  })

  it('resets the token allowance after paying the smart contract to prevent draining the router', async () => {
     let amountIn = ethers.utils.parseUnits('1000', 18);
    let exchangeRouter = await ethers.getContractAt(IPancakeRouter02.abi, exchange.contracts.router.address)
    let amountsOut = await exchangeRouter.getAmountsOut(amountIn, [CONSTANTS[blockchain].WRAPPED, BUSD])
    let amountOutMin = amountsOut[amountsOut.length-1].toString()
    let BUSDToken = await ethers.getContractAt(Token[blockchain].DEFAULT, BUSD)
    let passedAmount = ethers.BigNumber.from(amountOutMin).mul(2)
    await router.connect(wallets[0]).route(
      [CONSTANTS[blockchain].NATIVE, BUSD], // path
      [amountIn, amountOutMin, now()+60000, 0, 0, passedAmount], // amounts
      [wallets[0].address, stakingContract.address], // addresses
      [swapPlugin.address, contractCallPlugin.address], // plugins
      ['doNotMoveTokens(address,uint256,bool)', 'true'], // data
      { value: amountIn }
    )
    let allowance = await BUSDToken.allowance(router.address, stakingContract.address)
    expect(allowance.toString()).to.eq('0') // it makes sure to only allow what is required to do the payment
  })
})
